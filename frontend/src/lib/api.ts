import type {
  CreateSalaResponse,
  JoinSalaResponse,
  FotoUploadResponse,
} from '@shared/schemas'

// ─── Base URL — siempre desde variable de entorno ─────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  ?? 'http://localhost:8787'

// ─── WebSocket URL — deriva wss:// de VITE_API_URL ────────────────────────────
export function getWsUrl(salaCode: string, jugadorId: string): string {
  const base = API_BASE.replace(/^https/, 'wss').replace(/^http/, 'ws')
  return `${base}/api/sala/${salaCode}/ws?jugadorId=${encodeURIComponent(jugadorId)}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; code?: string }
    const err = new Error(body.error ?? `HTTP ${res.status}`) as Error & { code?: string }
    err.code = body.code
    throw err
  }
  return res.json() as Promise<T>
}

// ─── API client ───────────────────────────────────────────────────────────────

export const api = {
  /** POST /api/sala — crear sala nueva */
  crearSala: async (): Promise<CreateSalaResponse> => {
    const res = await fetch(`${API_BASE}/api/sala`, { method: 'POST' })
    return handleResponse<CreateSalaResponse>(res)
  },

  /** POST /api/sala/:code/join — unirse con nickname */
  unirse: async (code: string, nickname: string): Promise<JoinSalaResponse> => {
    const res = await fetch(`${API_BASE}/api/sala/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    })
    return handleResponse<JoinSalaResponse>(res)
  },

  /** POST /api/sala/:code/foto — obtener presigned URL de R2 */
  obtenerUrlFoto: async (
    code: string,
    jugadorId: string,
    mimeType: string,
    sizeBytes: number,
  ): Promise<FotoUploadResponse> => {
    const res = await fetch(`${API_BASE}/api/sala/${code}/foto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadorId, mimeType, sizeBytes }),
    })
    return handleResponse<FotoUploadResponse>(res)
  },

  /** PUT a presigned URL — upload directo a R2 */
  subirFotoAR2: async (uploadUrl: string, file: File): Promise<void> => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!res.ok) throw new Error(`Upload falló: ${res.status}`)
  },

  /** DELETE /api/sala/:code — cerrar sala y limpiar R2 (requiere ser el host) */
  cerrarSala: async (code: string, jugadorId: string): Promise<void> => {
    await fetch(`${API_BASE}/api/sala/${code}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadorId }),
    })
  },
}
