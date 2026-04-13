import { z } from 'zod'

// ─── HTTP request/response schemas ───────────────────────────────────────────

export const JoinSalaRequestSchema = z.object({
  nickname: z.string().min(1, 'Nickname requerido').max(20, 'Máximo 20 caracteres'),
})

export const FotoUploadRequestSchema = z.object({
  jugadorId: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  sizeBytes: z.number().int().positive().max(5 * 1024 * 1024), // 5 MB
})

// ─── WebSocket client → server events ────────────────────────────────────────

export const ClientWSEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('JOIN'), nickname: z.string().min(1).max(20) }),
  z.object({ type: z.literal('FOTOS_READY'), fotoKeys: z.array(z.string()).min(10).max(20) }),
  z.object({ type: z.literal('START_GAME') }),
  z.object({
    type: z.literal('ANSWER'),
    propietarioId: z.string(),
    tiempoMs: z.number().int().min(0).max(15000),
  }),
  z.object({ type: z.literal('PLAY_AGAIN') }),
  z.object({ type: z.literal('ABORT_GAME') }),
])

export type ClientWSEvent = z.infer<typeof ClientWSEventSchema>

// ─── Error codes ──────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  ROOM_NOT_FOUND:       'ROOM_NOT_FOUND',
  ROOM_FULL:            'ROOM_FULL',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  INVALID_NICKNAME:     'INVALID_NICKNAME',
  NICKNAME_TAKEN:       'NICKNAME_TAKEN',
  UPLOAD_FAILED:        'UPLOAD_FAILED',
  INSUFFICIENT_PHOTOS:  'INSUFFICIENT_PHOTOS',
  UNAUTHORIZED:         'UNAUTHORIZED',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  ROOM_NOT_FOUND:       'Esta sala ya cerró o el código no es correcto.',
  ROOM_FULL:            'Esta sala ya tiene el máximo de jugadores.',
  GAME_ALREADY_STARTED: 'La partida ya empezó. Espera a la siguiente.',
  INVALID_NICKNAME:     'El nickname debe tener entre 1 y 20 caracteres.',
  NICKNAME_TAKEN:       'Ese nombre ya lo usa otro jugador en esta sala.',
  UPLOAD_FAILED:        'No pudimos subir esa foto. Inténtalo de nuevo.',
  INSUFFICIENT_PHOTOS:  'Necesitas al menos 10 fotos para confirmar.',
  UNAUTHORIZED:         'No tienes permiso para esta acción.',
}
