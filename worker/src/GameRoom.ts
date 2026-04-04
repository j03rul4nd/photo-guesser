import { z } from 'zod'
import type { Env } from './types'
import { ClientWSEventSchema, ERROR_CODES, ERROR_MESSAGES } from './schemas'

// ─── Internal state types ─────────────────────────────────────────────────────

type RoomState =
  | 'waiting'
  | 'lobby_ready'
  | 'round_showing'
  | 'round_results'
  | 'game_over'
  | 'resetting'

interface Jugador {
  id: string
  nickname: string
  fotoKeys: string[]
  puntuacion: number
  conectado: boolean
  fotosListas: boolean
}

interface FotoRonda {
  key: string
  propietarioId: string
  propietarioNickname: string
  /** URL firmada generada al inicio de la ronda */
  url: string
}

interface Respuesta {
  propietarioId: string
  tiempoMs: number
  timestamp: number
}

// ─── Server → Client event builders ──────────────────────────────────────────

function lobbyUpdateEvent(jugadores: Map<string, Jugador>): string {
  return JSON.stringify({
    type: 'LOBBY_UPDATE',
    jugadores: Array.from(jugadores.values()).map((j) => ({
      id: j.id,
      nickname: j.nickname,
      fotosListas: j.fotosListas,
      conectado: j.conectado,
      puntuacion: j.puntuacion,
    })),
  })
}

function errorEvent(code: keyof typeof ERROR_CODES): string {
  return JSON.stringify({
    type: 'ERROR',
    code,
    message: ERROR_MESSAGES[code],
  })
}

function calcPuntos(tiempoMs: number): number {
  if (tiempoMs < 5000)  return 100
  if (tiempoMs < 10000) return 75
  return 50
}

// ─── Durable Object ───────────────────────────────────────────────────────────

export class GameRoom implements DurableObject {
  private estado: RoomState = 'waiting'
  private host: string | null = null
  private jugadores: Map<string, Jugador> = new Map()
  private connections: Map<string, WebSocket> = new Map()

  // Foto pool: todas las fotos de todos los jugadores mezcladas
  private fotosPool: FotoRonda[] = []
  private fotosUsadas: Set<string> = new Set()

  private rondaActual = 0
  private totalRondas = 0
  private fotoActual: FotoRonda | null = null
  private respuestasRonda: Map<string, Respuesta> = new Map()
  private respuestasCount = 0
  private timerHandle: ReturnType<typeof setTimeout> | null = null

  // DO Alarm: cleanup a los 30 min de inactividad
  private lastActivity = Date.now()

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env,
  ) {}

  // ─── fetch — entry point for all requests ──────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    this.lastActivity = Date.now()

    // HTTP internal routes (from the Worker router)
    if (url.pathname === '/init' && request.method === 'POST') {
      return this.handleInit()
    }
    if (url.pathname === '/join' && request.method === 'POST') {
      return this.handleJoin(request)
    }
    if (url.pathname === '/auth' && request.method === 'POST') {
      return this.handleAuth(request)
    }
    if (url.pathname === '/close' && request.method === 'POST') {
      return this.handleClose()
    }

    // WebSocket upgrade (from GET /api/sala/:code/ws)
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader?.toLowerCase() === 'websocket') {
      return this.handleWebSocket(request)
    }

    return new Response('Not found', { status: 404 })
  }

  // ─── HTTP handlers ──────────────────────────────────────────────────────────

  private handleInit(): Response {
    // Schedule cleanup alarm 30 minutes from now
    void this.state.storage.setAlarm(Date.now() + 30 * 60 * 1000)
    return new Response('OK', { status: 200 })
  }

  private async handleJoin(request: Request): Promise<Response> {
    const { jugadorId, nickname } = await request.json() as { jugadorId: string; nickname: string }

    // State checks
    if (this.estado === 'round_showing' || this.estado === 'round_results') {
      return new Response(
        JSON.stringify({ code: ERROR_CODES.GAME_ALREADY_STARTED, error: ERROR_MESSAGES.GAME_ALREADY_STARTED }),
        { status: 409 },
      )
    }
    if (this.jugadores.size >= 10) {
      return new Response(
        JSON.stringify({ code: ERROR_CODES.ROOM_FULL, error: ERROR_MESSAGES.ROOM_FULL }),
        { status: 409 },
      )
    }

    // Si el jugador ya existe (reconexión), solo actualizar conectado
    const existing = this.jugadores.get(jugadorId)
    if (existing) {
      existing.conectado = true
      this.broadcast(lobbyUpdateEvent(this.jugadores))
      return new Response('OK', { status: 200 })
    }

    // Nuevo jugador
    const jugador: Jugador = {
      id: jugadorId,
      nickname,
      fotoKeys: [],
      puntuacion: 0,
      conectado: false, // se marcará true cuando abra el WS
      fotosListas: false,
    }

    this.jugadores.set(jugadorId, jugador)

    // El primero en unirse es el host
    if (!this.host) this.host = jugadorId

    this.broadcast(lobbyUpdateEvent(this.jugadores))
    return new Response('OK', { status: 200 })
  }

  private async handleAuth(request: Request): Promise<Response> {
    const { jugadorId } = await request.json() as { jugadorId: string }
    if (!this.jugadores.has(jugadorId)) {
      return new Response('Unauthorized', { status: 403 })
    }
    return new Response('OK', { status: 200 })
  }

  private handleClose(): Response {
    this.clearTimer()
    // Notificar a todos los conectados
    this.broadcastRaw(JSON.stringify({ type: 'ROOM_CLOSED' }))
    // Cerrar todas las conexiones
    for (const ws of this.connections.values()) {
      try { ws.close(1001, 'Room closed') } catch { /* ignore */ }
    }
    this.connections.clear()
    return new Response('OK', { status: 200 })
  }

  // ─── WebSocket upgrade ──────────────────────────────────────────────────────

  private handleWebSocket(request: Request): Response {
    const url = new URL(request.url)
    const jugadorId = url.searchParams.get('jugadorId') ?? ''

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket]

    server.accept()

    this.connections.set(jugadorId, server)

    // Mark player as connected
    const jugador = this.jugadores.get(jugadorId)
    if (jugador) {
      jugador.conectado = true
      // Notify reconnection if was disconnected
      const wasDisconnected = !jugador.conectado
      if (wasDisconnected) {
        this.broadcast(JSON.stringify({ type: 'PLAYER_RECONNECTED', jugadorId }))
      }
      this.broadcast(lobbyUpdateEvent(this.jugadores))
    }

    server.addEventListener('message', (event) => {
      void this.handleMessage(jugadorId, event.data as string)
    })

    server.addEventListener('close', () => {
      this.handleDisconnect(jugadorId)
    })

    server.addEventListener('error', () => {
      this.handleDisconnect(jugadorId)
    })

    // Send current lobby state immediately on connect
    server.send(lobbyUpdateEvent(this.jugadores))

    // Reset alarm on activity
    void this.state.storage.setAlarm(Date.now() + 30 * 60 * 1000)

    return new Response(null, { status: 101, webSocket: client })
  }

  // ─── Message handler ────────────────────────────────────────────────────────

  private async handleMessage(jugadorId: string, raw: string): Promise<void> {
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { return }

    const result = ClientWSEventSchema.safeParse(parsed)
    if (!result.success) return

    const event = result.data
    const jugador = this.jugadores.get(jugadorId)
    if (!jugador) return

    switch (event.type) {
      case 'JOIN': {
        // WebSocket JOIN — update nickname if needed, send current state
        jugador.nickname = event.nickname
        this.broadcast(lobbyUpdateEvent(this.jugadores))
        break
      }

      case 'FOTOS_READY': {
        jugador.fotoKeys = event.fotoKeys
        jugador.fotosListas = true
        this.broadcast(lobbyUpdateEvent(this.jugadores))

        // Check if all ready
        const listos = Array.from(this.jugadores.values()).filter((j) => j.fotosListas && j.conectado)
        if (listos.length >= 2) {
          this.estado = 'lobby_ready'
          this.broadcast(lobbyUpdateEvent(this.jugadores))
        }
        break
      }

      case 'START_GAME': {
        if (jugadorId !== this.host) {
          this.sendTo(jugadorId, errorEvent('UNAUTHORIZED'))
          return
        }
        if (this.estado !== 'lobby_ready') return

        await this.startGame()
        break
      }

      case 'ANSWER': {
        if (this.estado !== 'round_showing') return
        if (!this.fotoActual) return
        // El dueño de la foto no puede responder
        if (this.fotoActual.propietarioId === jugadorId) return
        // Solo una respuesta por jugador por ronda
        if (this.respuestasRonda.has(jugadorId)) return

        this.respuestasRonda.set(jugadorId, {
          propietarioId: event.propietarioId,
          tiempoMs: event.tiempoMs,
          timestamp: Date.now(),
        })
        this.respuestasCount++

        // Notificar al propietario cuántos han respondido
        const owner = this.fotoActual.propietarioId
        const totalQueResponden = this.jugadores.size - 1 // todos menos el dueño
        this.sendTo(owner, JSON.stringify({
          type: 'PLAYER_RESPONSE_COUNT',
          count: this.respuestasCount,
          total: totalQueResponden,
        }))

        // Si todos respondieron, adelantar el resultado
        if (this.respuestasCount >= totalQueResponden) {
          this.clearTimer()
          void this.resolveRound()
        }
        break
      }

      case 'PLAY_AGAIN': {
        if (jugadorId !== this.host) return
        if (this.estado !== 'game_over') return
        await this.resetGame()
        break
      }
    }
  }

  // ─── Game flow ──────────────────────────────────────────────────────────────

  private async startGame(): Promise<void> {
    this.estado = 'round_showing'

    // Build foto pool: all fotos from all players, shuffled
    this.fotosPool = []
    for (const jugador of this.jugadores.values()) {
      for (const key of jugador.fotoKeys) {
        this.fotosPool.push({
          key,
          propietarioId: jugador.id,
          propietarioNickname: jugador.nickname,
          url: await this.getSignedUrl(key),
        })
      }
    }

    // Fisher-Yates shuffle
    for (let i = this.fotosPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.fotosPool[i], this.fotosPool[j]] = [this.fotosPool[j]!, this.fotosPool[i]!]
    }

    this.totalRondas = this.fotosPool.length
    this.rondaActual = 0
    this.fotosUsadas.clear()

    this.broadcast(JSON.stringify({ type: 'GAME_START', totalRondas: this.totalRondas }))

    // Small delay before first round
    await new Promise((r) => setTimeout(r, 1000))
    await this.nextRound()
  }

  private async nextRound(): Promise<void> {
    // Find next unused foto
    const disponibles = this.fotosPool.filter((f) => !this.fotosUsadas.has(f.key))
    if (disponibles.length === 0) {
      await this.endGame()
      return
    }

    const foto = disponibles[Math.floor(Math.random() * disponibles.length)]!
    this.fotosUsadas.add(foto.key)
    this.fotoActual = foto
    this.rondaActual++
    this.respuestasRonda.clear()
    this.respuestasCount = 0
    this.estado = 'round_showing'

    // Build answer options: propietario + 3 random other nicknames
    const otrosNicknames = Array.from(this.jugadores.values())
      .filter((j) => j.id !== foto.propietarioId)
      .map((j) => j.nickname)

    // Shuffle and pick up to 3 distractors
    for (let i = otrosNicknames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[otrosNicknames[i], otrosNicknames[j]] = [otrosNicknames[j]!, otrosNicknames[i]!]
    }
    const distractors = otrosNicknames.slice(0, 3)
    const opciones = [foto.propietarioNickname, ...distractors]

    // Shuffle options
    for (let i = opciones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opciones[i], opciones[j]] = [opciones[j]!, opciones[i]!]
    }

    // Refresh signed URL for this round
    foto.url = await this.getSignedUrl(foto.key)

    this.broadcast(JSON.stringify({
      type: 'ROUND_START',
      rondaNum: this.rondaActual,
      fotoUrl: foto.url,
      opciones,
      timerMs: 15000,
    }))

    // Start 15s timer
    this.timerHandle = setTimeout(() => {
      void this.resolveRound()
    }, 15000)
  }

  private async resolveRound(): Promise<void> {
    this.clearTimer()
    if (!this.fotoActual) return
    this.estado = 'round_results'

    const foto = this.fotoActual
    const puntosGanados: Record<string, number> = {}
    const respuestasCorrectas: string[] = []

    // Calculate scores
    for (const [jugadorId, respuesta] of this.respuestasRonda.entries()) {
      const acierto = respuesta.propietarioId === foto.propietarioId
      if (acierto) {
        const puntos = calcPuntos(respuesta.tiempoMs)
        puntosGanados[jugadorId] = puntos
        respuestasCorrectas.push(jugadorId)
        const jugador = this.jugadores.get(jugadorId)
        if (jugador) jugador.puntuacion += puntos
      }
    }

    // Build ranking for this round
    const rankingRonda = Array.from(this.jugadores.values())
      .map((j) => ({
        id: j.id,
        nickname: j.nickname,
        puntos: puntosGanados[j.id] ?? 0,
        puntosTotal: j.puntuacion,
      }))
      .sort((a, b) => b.puntosTotal - a.puntosTotal)

    this.broadcast(JSON.stringify({
      type: 'ROUND_RESULT',
      propietarioId: foto.propietarioId,
      propietarioNickname: foto.propietarioNickname,
      respuestasCorrectas,
      puntosGanados,
      rankingRonda,
    }))

    // Pause 3s then next round
    await new Promise((r) => setTimeout(r, 3000))

    if (this.fotosUsadas.size >= this.fotosPool.length) {
      await this.endGame()
    } else {
      await this.nextRound()
    }
  }

  private async endGame(): Promise<void> {
    this.estado = 'game_over'
    this.clearTimer()

    const rankingFinal = Array.from(this.jugadores.values())
      .map((j) => ({
        id: j.id,
        nickname: j.nickname,
        puntosTotal: j.puntuacion,
        fotosAdivinadas: 0, // TODO: track this per player
      }))
      .sort((a, b) => b.puntosTotal - a.puntosTotal)

    this.broadcast(JSON.stringify({ type: 'GAME_END', rankingFinal }))
  }

  private async resetGame(): Promise<void> {
    this.estado = 'resetting'

    // Reset all player scores and foto state
    for (const jugador of this.jugadores.values()) {
      jugador.puntuacion = 0
      jugador.fotoKeys = []
      jugador.fotosListas = false
    }

    this.fotosPool = []
    this.fotosUsadas.clear()
    this.rondaActual = 0
    this.fotoActual = null
    this.respuestasRonda.clear()
    this.respuestasCount = 0
    this.estado = 'waiting'

    this.broadcast(JSON.stringify({ type: 'GAME_RESET' }))
    this.broadcast(lobbyUpdateEvent(this.jugadores))
  }

  // ─── Disconnect handling ────────────────────────────────────────────────────

  private handleDisconnect(jugadorId: string): void {
    this.connections.delete(jugadorId)
    const jugador = this.jugadores.get(jugadorId)
    if (!jugador) return

    jugador.conectado = false

    this.broadcast(JSON.stringify({
      type: 'PLAYER_DISCONNECTED',
      jugadorId,
      nickname: jugador.nickname,
    }))

    // If host disconnected, pass host to next connected player
    if (jugadorId === this.host) {
      const nextHost = Array.from(this.jugadores.values()).find(
        (j) => j.conectado && j.id !== jugadorId,
      )
      if (nextHost) {
        this.host = nextHost.id
        this.broadcast(JSON.stringify({ type: 'HOST_CHANGED', newHostId: nextHost.id }))
      }
    }

    this.broadcast(lobbyUpdateEvent(this.jugadores))
  }

  // ─── DO Alarm — cleanup después de 30 min de inactividad ───────────────────

  async alarm(): Promise<void> {
    const inactivoMs = Date.now() - this.lastActivity
    if (inactivoMs >= 30 * 60 * 1000) {
      // Cerrar todas las conexiones
      for (const ws of this.connections.values()) {
        try { ws.close(1001, 'Inactivity timeout') } catch { /* ignore */ }
      }
      this.connections.clear()
      // Las fotos en R2 se borran desde el Worker vía DELETE /api/sala/:code
      // En un sistema completo llamaríamos al Worker aquí; por ahora solo cerramos
    } else {
      // Reschedule
      await this.state.storage.setAlarm(Date.now() + 30 * 60 * 1000)
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private broadcast(message: string): void {
    for (const [, ws] of this.connections) {
      try { ws.send(message) } catch { /* ignore closed connections */ }
    }
  }

  private broadcastRaw(message: string): void {
    this.broadcast(message)
  }

  private sendTo(jugadorId: string, message: string): void {
    const ws = this.connections.get(jugadorId)
    if (ws) {
      try { ws.send(message) } catch { /* ignore */ }
    }
  }

  private clearTimer(): void {
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle)
      this.timerHandle = null
    }
  }

  private async getSignedUrl(key: string): Promise<string> {
    // En producción: generar presigned URL de R2
    // En desarrollo sin R2: devolver la key como URL relativa
    try {
      const obj = await this.env.PHOTOS_BUCKET.get(key)
      if (!obj) return `/dev-foto/${key}`
      // R2 no tiene presigned URLs directas desde DO — se hace desde el Worker
      // Aquí devolvemos una URL de acceso público o la gestionamos vía proxy
      return `/api/foto/${encodeURIComponent(key)}`
    } catch {
      return `/dev-foto/${key}`
    }
  }
}
