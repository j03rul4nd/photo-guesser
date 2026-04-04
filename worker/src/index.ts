import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, RateLimitEntry } from './types'
import {
  generateSalaCode,
  generateJugadorId,
  jsonError,
  getClientIP,
  normalizeSalaCode,
} from './utils'
import { JoinSalaRequestSchema, FotoUploadRequestSchema, ERROR_MESSAGES } from './schemas'

export { GameRoom } from './GameRoom'

// ─── Rate limit store (in-memory, per Worker instance) ───────────────────────
// Máx 10 salas por IP/hora. No persiste entre instancias — suficiente para MVP.
const rateLimitStore = new Map<string, RateLimitEntry>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

// ─── Hono app ─────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>()

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'https://*.pages.dev'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
)

// ─── POST /api/sala ───────────────────────────────────────────────────────────
app.post('/api/sala', async (c) => {
  const ip = getClientIP(c.req.raw)
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Demasiadas salas creadas. Espera un poco.', code: 'RATE_LIMITED' }, 429)
  }

  const codigo = generateSalaCode()
  const origin = c.req.header('origin') ?? 'http://localhost:5173'
  const joinUrl = `${origin}/sala/${codigo}`

  // Crear el Durable Object para esta sala
  const doId = c.env.GAME_ROOM.idFromName(codigo)
  const stub = c.env.GAME_ROOM.get(doId)
  await stub.fetch(new Request('http://internal/init', { method: 'POST' }))

  return c.json({ codigo, joinUrl }, 201)
})

// ─── POST /api/sala/:code/join ────────────────────────────────────────────────
app.post('/api/sala/:code/join', async (c) => {
  const codigo = normalizeSalaCode(c.req.param('code'))

  let body: unknown
  try { body = await c.req.json() }
  catch { return jsonError('Body JSON inválido', 400) }

  const result = JoinSalaRequestSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_NICKNAME
    return jsonError(message, 400, 'INVALID_NICKNAME')
  }

  const { nickname } = result.data
  const jugadorId = generateJugadorId()

  const doId = c.env.GAME_ROOM.idFromName(codigo)
  const stub = c.env.GAME_ROOM.get(doId)

  const doResponse = await stub.fetch(
    new Request('http://internal/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadorId, nickname }),
    }),
  )

  if (!doResponse.ok) {
    const err = await doResponse.json() as { code?: string; error?: string }
    const code = (err.code ?? 'ROOM_NOT_FOUND') as keyof typeof ERROR_MESSAGES
    const msg = ERROR_MESSAGES[code] ?? err.error ?? 'Error desconocido'
    return jsonError(msg, doResponse.status, code)
  }

  return c.json({ jugadorId, nickname }, 200)
})

// ─── POST /api/sala/:code/foto ────────────────────────────────────────────────
app.post('/api/sala/:code/foto', async (c) => {
  const codigo = normalizeSalaCode(c.req.param('code'))

  let body: unknown
  try { body = await c.req.json() }
  catch { return jsonError('Body JSON inválido', 400) }

  const result = FotoUploadRequestSchema.safeParse(body)
  if (!result.success) {
    return jsonError('Datos de foto inválidos', 400, 'UPLOAD_FAILED')
  }

  const { jugadorId, mimeType } = result.data

  // Verificar que el jugadorId pertenece a esta sala
  const doId = c.env.GAME_ROOM.idFromName(codigo)
  const stub = c.env.GAME_ROOM.get(doId)

  const authRes = await stub.fetch(
    new Request('http://internal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadorId }),
    }),
  )
  if (!authRes.ok) {
    return jsonError(ERROR_MESSAGES.UNAUTHORIZED, 403, 'UNAUTHORIZED')
  }

  // Generar key única en R2
  const ext = mimeType.split('/')[1] ?? 'jpg'
  const key = `fotos/${codigo}/${jugadorId}/${crypto.randomUUID()}.${ext}`

  // Generar presigned URL de R2 con TTL 1 hora
  const expiresIn = 3600 // 1 hora
  const uploadUrl = await (c.env.PHOTOS_BUCKET as R2Bucket & {
    createPresignedUrl?: (method: string, key: string, opts: { expiresIn: number }) => Promise<string>
  }).createPresignedUrl?.('PUT', key, { expiresIn })

  if (!uploadUrl) {
    // Fallback para desarrollo local sin R2 real
    return c.json({ uploadUrl: `http://localhost:8787/dev-upload/${key}`, key }, 200)
  }

  return c.json({ uploadUrl, key }, 200)
})

// ─── GET /api/sala/:code/ws ───────────────────────────────────────────────────
app.get('/api/sala/:code/ws', async (c) => {
  const codigo = normalizeSalaCode(c.req.param('code'))

  const upgradeHeader = c.req.header('Upgrade')
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return jsonError('Expected WebSocket upgrade', 426)
  }

  const doId = c.env.GAME_ROOM.idFromName(codigo)
  const stub = c.env.GAME_ROOM.get(doId)
  return stub.fetch(c.req.raw)
})

// ─── DELETE /api/sala/:code ───────────────────────────────────────────────────
app.delete('/api/sala/:code', async (c) => {
  const codigo = normalizeSalaCode(c.req.param('code'))

  const doId = c.env.GAME_ROOM.idFromName(codigo)
  const stub = c.env.GAME_ROOM.get(doId)
  await stub.fetch(new Request('http://internal/close', { method: 'POST' }))

  // Borrar todas las fotos del bucket para esta sala
  const prefix = `fotos/${codigo}/`
  const listed = await c.env.PHOTOS_BUCKET.list({ prefix })
  if (listed.objects.length > 0) {
    await Promise.all(listed.objects.map((obj) => c.env.PHOTOS_BUCKET.delete(obj.key)))
  }

  return c.json({ ok: true }, 200)
})

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }))

app.notFound((c) => c.json({ error: 'Ruta no encontrada' }, 404))

// ─── Worker export ────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },
}
