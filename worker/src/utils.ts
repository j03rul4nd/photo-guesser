// ─── Sala code generator ──────────────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusables: 0/O, 1/I

export function generateSalaCode(): string {
  let code = ''
  const array = new Uint8Array(7)
  crypto.getRandomValues(array)
  for (const byte of array) {
    code += CODE_CHARS[byte % CODE_CHARS.length]
  }
  return code
}

// ─── Player ID generator ──────────────────────────────────────────────────────

export function generateJugadorId(): string {
  return crypto.randomUUID()
}

// ─── JSON response helpers ────────────────────────────────────────────────────

export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export function jsonError(message: string, status: number, code?: string): Response {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// ─── IP extraction ────────────────────────────────────────────────────────────

export function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

// ─── Normalize sala code ──────────────────────────────────────────────────────

export function normalizeSalaCode(code: string): string {
  return code.toUpperCase().trim()
}
