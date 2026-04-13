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

// ─── Rate limit stores (in-memory, por instancia Worker) ──────────────────────
// Limitación conocida: no se comparte entre instancias CF. Suficiente para MVP.
const salaRateLimit   = new Map<string, RateLimitEntry>()   // Crear sala: 10/hora
const joinRateLimit   = new Map<string, RateLimitEntry>()   // Join sala: 15/min

function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

// ─── HMAC helpers — firmar/verificar tokens de upload ────────────────────────

async function signUploadKey(key: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(key))
  // base64url sin padding
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function verifyUploadToken(key: string, token: string, secret: string): Promise<boolean> {
  try {
    const expected = await signUploadKey(key, secret)
    return expected === token
  } catch { return false }
}

// ─── Hono app ─────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>()

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return ''
      if (origin === 'http://localhost:5173') return origin
      if (origin === 'https://photo-guesser.pages.dev') return origin
      if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin)) return origin
      return ''
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
)

// ─── POST /api/sala ───────────────────────────────────────────────────────────
app.post('/api/sala', async (c) => {
  const ip = getClientIP(c.req.raw)
  if (!checkRateLimit(salaRateLimit, ip, 10, 60 * 60 * 1000)) {
    return c.json({ error: 'Demasiadas salas creadas. Espera un poco.', code: 'RATE_LIMITED' }, 429)
  }

  const codigo = generateSalaCode()
  const origin = c.req.header('origin') ?? 'http://localhost:5173'
  const joinUrl = `${origin}/sala/${codigo}`

  const doId = c.env.GAME_ROOM.idFromName(codigo)
  const stub = c.env.GAME_ROOM.get(doId)
  await stub.fetch(new Request('http://internal/init', { method: 'POST' }))

  return c.json({ codigo, joinUrl }, 201)
})

// ─── POST /api/sala/:code/join ────────────────────────────────────────────────
app.post('/api/sala/:code/join', async (c) => {
  const codigo = normalizeSalaCode(c.req.param('code'))
  const ip = getClientIP(c.req.raw)

  // Máx 15 intentos de join por IP por minuto
  if (!checkRateLimit(joinRateLimit, ip, 15, 60 * 1000)) {
    return jsonError('Demasiados intentos. Espera un momento.', 429, 'RATE_LIMITED')
  }

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

  // Verificar jugadorId y cuota de uploads
  const doId = c.env.GAME_ROOM.idFromName(codigo)
  const stub = c.env.GAME_ROOM.get(doId)

  const authRes = await stub.fetch(
    new Request('http://internal/auth-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadorId }),
    }),
  )
  if (!authRes.ok) {
    const err = await authRes.json() as { code?: string; error?: string }
    const code = (err.code ?? 'UNAUTHORIZED') as keyof typeof ERROR_MESSAGES
    return jsonError(ERROR_MESSAGES[code] ?? 'Error de autenticación', authRes.status, code)
  }

  const ext = mimeType.split('/')[1] ?? 'jpg'
  const key = `fotos/${codigo}/${jugadorId}/${crypto.randomUUID()}.${ext}`

  // Firmar la key para evitar uploads no autorizados
  const origin = new URL(c.req.url).origin
  let uploadUrl: string
  if (c.env.UPLOAD_SECRET) {
    const token = await signUploadKey(key, c.env.UPLOAD_SECRET)
    uploadUrl = `${origin}/api/foto/${encodeURIComponent(key)}?t=${token}`
  } else {
    uploadUrl = `${origin}/api/foto/${encodeURIComponent(key)}`
  }

  return c.json({ uploadUrl, key }, 200)
})

// ─── PUT /api/foto/:key — recibe binario del cliente y lo guarda en R2 ────────
app.put('/api/foto/:key{.+$}', async (c) => {
  const key = decodeURIComponent(c.req.param('key'))
  const contentType = c.req.header('Content-Type') ?? 'image/jpeg'

  if (!contentType.startsWith('image/')) {
    return jsonError('Solo se permiten imágenes', 400)
  }

  // Validar token HMAC si hay secret configurado
  if (c.env.UPLOAD_SECRET) {
    const token = new URL(c.req.url).searchParams.get('t') ?? ''
    if (!token || !(await verifyUploadToken(key, token, c.env.UPLOAD_SECRET))) {
      return jsonError('Token de upload inválido o expirado', 403, 'UNAUTHORIZED')
    }
  }

  // Validar que la key tiene el formato esperado (fotos/{code}/{uuid}/{uuid}.{ext})
  if (!/^fotos\/[A-Z0-9]{4,10}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.\w{3,4}$/.test(key)) {
    return jsonError('Key de foto inválida', 400, 'UPLOAD_FAILED')
  }

  const buffer = await c.req.arrayBuffer()

  if (buffer.byteLength > 5 * 1024 * 1024) {
    return jsonError('Archivo demasiado grande (máx 5MB)', 400)
  }
  if (buffer.byteLength < 100) {
    return jsonError('Archivo demasiado pequeño', 400)
  }

  await c.env.PHOTOS_BUCKET.put(key, buffer, {
    httpMetadata: { contentType },
  })

  return c.json({ ok: true }, 200)
})

// ─── GET /api/foto/:key — sirve una foto desde R2 ─────────────────────────────
app.get('/api/foto/:key{.+$}', async (c) => {
  const key = decodeURIComponent(c.req.param('key'))
  const obj = await c.env.PHOTOS_BUCKET.get(key)

  if (!obj) {
    return c.json({ error: 'Foto no encontrada' }, 404)
  }

  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'private, max-age=3600')
  // Evitar hotlinking desde orígenes externos
  headers.set('X-Content-Type-Options', 'nosniff')

  return new Response(obj.body, { headers })
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

// ─── DELETE /api/sala/:code — requiere ser el host ────────────────────────────
app.delete('/api/sala/:code', async (c) => {
  const codigo = normalizeSalaCode(c.req.param('code'))

  // Autenticación: el host debe identificarse
  let jugadorId = ''
  try {
    const body = await c.req.json() as { jugadorId?: string }
    jugadorId = body.jugadorId ?? ''
  } catch { /* sin body */ }

  if (!jugadorId) {
    jugadorId = c.req.header('X-Host-Id') ?? ''
  }

  if (!jugadorId) {
    return jsonError('Se requiere jugadorId del host para cerrar la sala', 403, 'UNAUTHORIZED')
  }

  const doId = c.env.GAME_ROOM.idFromName(codigo)
  const stub = c.env.GAME_ROOM.get(doId)

  // Verificar que el requester es el host actual
  const authRes = await stub.fetch(
    new Request('http://internal/auth-host', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadorId }),
    }),
  )
  if (!authRes.ok) {
    return jsonError('No eres el host de esta sala', 403, 'UNAUTHORIZED')
  }

  // Cerrar el DO (broadcast ROOM_CLOSED a todos)
  await stub.fetch(new Request('http://internal/close', { method: 'POST' }))

  // Borrar todas las fotos del bucket para esta sala
  await deleteRoomPhotos(c.env, codigo)

  return c.json({ ok: true }, 200)
})

// ─── Helper: limpiar R2 de una sala ──────────────────────────────────────────
async function deleteRoomPhotos(env: Env, codigo: string): Promise<void> {
  const prefix = `fotos/${codigo}/`
  let cursor: string | undefined
  do {
    const listed = await env.PHOTOS_BUCKET.list({ prefix, cursor })
    if (listed.objects.length > 0) {
      await Promise.all(listed.objects.map((obj) => env.PHOTOS_BUCKET.delete(obj.key)))
    }
    cursor = listed.truncated ? listed.cursor : undefined
  } while (cursor)
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', version: '2.0.0' }))

app.notFound((c) => c.json({ error: 'Ruta no encontrada' }, 404))

// ─── Worker export ────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },
}
