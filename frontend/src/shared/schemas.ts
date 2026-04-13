import { z } from 'zod'

// ─── Shared entity schemas ────────────────────────────────────────────────────

export const JugadorSchema = z.object({
  id: z.string(),
  nickname: z.string().min(1).max(20),
  fotosListas: z.boolean(),
  conectado: z.boolean(),
  puntuacion: z.number().int().min(0),
})

export const RankingItemSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  puntos: z.number().int(),
  puntosTotal: z.number().int(),
})

export const FinalRankingItemSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  puntosTotal: z.number().int(),
  fotosAdivinadas: z.number().int(),
})

export type Jugador = z.infer<typeof JugadorSchema>
export type RankingItem = z.infer<typeof RankingItemSchema>
export type FinalRankingItem = z.infer<typeof FinalRankingItemSchema>

// ─── Server → Client WebSocket events ────────────────────────────────────────

export const ServerWSEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('LOBBY_UPDATE'),
    hostId: z.string(),
    jugadores: z.array(JugadorSchema),
  }),
  z.object({
    type: z.literal('GAME_START'),
    totalRondas: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('ROUND_START'),
    rondaNum: z.number().int().positive(),
    fotoUrl: z.string(), // URL relativa (/api/foto/...) — no usar z.string().url()
    opciones: z.array(z.object({ id: z.string(), nickname: z.string() })),
    timerMs: z.number().int().positive(),
  }),
  // v3.1: only emitted to the photo owner
  z.object({
    type: z.literal('PLAYER_RESPONSE_COUNT'),
    count: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('ROUND_RESULT'),
    propietarioId: z.string(),
    propietarioNickname: z.string(),
    respuestasCorrectas: z.array(z.string()),
    puntosGanados: z.record(z.string(), z.number()),
    rankingRonda: z.array(RankingItemSchema),
  }),
  z.object({
    type: z.literal('GAME_END'),
    rankingFinal: z.array(FinalRankingItemSchema),
  }),
  // v3.1: emitted to all when host confirms "Play again"
  z.object({
    type: z.literal('GAME_RESET'),
    nuevoCodigo: z.string().optional(),
  }),
  z.object({
    type: z.literal('PLAYER_DISCONNECTED'),
    jugadorId: z.string(),
    nickname: z.string(),
  }),
  z.object({
    type: z.literal('PLAYER_RECONNECTED'),
    jugadorId: z.string(),
  }),
  z.object({
    type: z.literal('HOST_CHANGED'),
    newHostId: z.string(),
  }),
  z.object({
    type: z.literal('ERROR'),
    code: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal('ROOM_CLOSED'),
  }),
])

export type ServerWSEvent = z.infer<typeof ServerWSEventSchema>

// ─── Client → Server WebSocket events ────────────────────────────────────────

export const ClientWSEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('JOIN'),
    nickname: z.string().min(1).max(20),
  }),
  z.object({
    type: z.literal('FOTOS_READY'),
    fotoKeys: z.array(z.string()).min(10).max(20),
  }),
  z.object({
    type: z.literal('START_GAME'),
  }),
  z.object({
    type: z.literal('ANSWER'),
    propietarioId: z.string(),
    tiempoMs: z.number().int().min(0).max(15000),
  }),
  // v3.1: host only, after GAME_END
  z.object({
    type: z.literal('PLAY_AGAIN'),
  }),
  // v3.2: host only, aborts a running game and shows final ranking with current scores
  z.object({
    type: z.literal('ABORT_GAME'),
  }),
])

export type ClientWSEvent = z.infer<typeof ClientWSEventSchema>

// ─── HTTP API schemas ─────────────────────────────────────────────────────────

export const CreateSalaResponseSchema = z.object({
  codigo: z.string(),
  joinUrl: z.string().url(),
})

export const JoinSalaRequestSchema = z.object({
  nickname: z.string().min(1).max(20),
})

export const JoinSalaResponseSchema = z.object({
  jugadorId: z.string(),
  nickname: z.string(),
})

export const FotoUploadRequestSchema = z.object({
  jugadorId: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  sizeBytes: z.number().int().positive().max(5 * 1024 * 1024), // 5MB max
})

export const FotoUploadResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
})

export type CreateSalaResponse = z.infer<typeof CreateSalaResponseSchema>
export type JoinSalaRequest = z.infer<typeof JoinSalaRequestSchema>
export type JoinSalaResponse = z.infer<typeof JoinSalaResponseSchema>
export type FotoUploadRequest = z.infer<typeof FotoUploadRequestSchema>
export type FotoUploadResponse = z.infer<typeof FotoUploadResponseSchema>

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
