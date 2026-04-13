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
  fotosAdivinadas: number
  uploadCount: number   // cuota: máx 20 uploads por jugador
}

interface FotoRonda {
  key: string
  propietarioId: string
  propietarioNickname: string
  url: string
}

interface Respuesta {
  propietarioId: string
  tiempoMs: number
  timestamp: number
}

type Opcion = { id: string; nickname: string }

// ─── Server → Client event builders ──────────────────────────────────────────

function lobbyUpdateEvent(jugadores: Map<string, Jugador>, hostId: string | null): string {
  return JSON.stringify({
    type: 'LOBBY_UPDATE',
    hostId: hostId ?? '',
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

  // Foto pool
  private fotosPool: FotoRonda[] = []
  private fotosUsadas: Set<string> = new Set()

  private rondaActual = 0
  private totalRondas = 0
  private fotoActual: FotoRonda | null = null
  private respuestasRonda: Map<string, Respuesta> = new Map()
  private timerHandle: ReturnType<typeof setTimeout> | null = null

  // Estado para reconexión mid-game
  private currentOpciones: Opcion[] = []
  private roundStartTime = 0
  private lastRoundResultJson: string | null = null
  private lastGameEndJson: string | null = null

  // Juego pausado cuando todos se desconectan
  private gamePaused = false

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

    if (url.pathname === '/init'        && request.method === 'POST') return this.handleInit()
    if (url.pathname === '/join'        && request.method === 'POST') return this.handleJoin(request)
    if (url.pathname === '/auth'        && request.method === 'POST') return this.handleAuth(request)
    if (url.pathname === '/auth-upload' && request.method === 'POST') return this.handleAuthUpload(request)
    if (url.pathname === '/auth-host'   && request.method === 'POST') return this.handleAuthHost(request)
    if (url.pathname === '/close'       && request.method === 'POST') return this.handleClose()

    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader?.toLowerCase() === 'websocket') return this.handleWebSocket(request)

    return new Response('Not found', { status: 404 })
  }

  // ─── HTTP handlers ──────────────────────────────────────────────────────────

  private handleInit(): Response {
    void this.state.storage.setAlarm(Date.now() + 30 * 60 * 1000)
    return new Response('OK', { status: 200 })
  }

  private async handleJoin(request: Request): Promise<Response> {
    const { jugadorId, nickname } = await request.json() as { jugadorId: string; nickname: string }

    // Validar nickname
    const trimmed = nickname?.trim() ?? ''
    if (trimmed.length < 1 || trimmed.length > 20) {
      return new Response(
        JSON.stringify({ code: ERROR_CODES.INVALID_NICKNAME, error: ERROR_MESSAGES.INVALID_NICKNAME }),
        { status: 422 },
      )
    }

    // Bloquear nuevas uniones durante juego activo o transición
    const estadosBloqueados: RoomState[] = ['round_showing', 'round_results', 'game_over', 'resetting']
    if (estadosBloqueados.includes(this.estado)) {
      console.log(`[JOIN] rechazado — estado=${this.estado} jugadorId=${jugadorId}`)
      return new Response(
        JSON.stringify({ code: ERROR_CODES.GAME_ALREADY_STARTED, error: ERROR_MESSAGES.GAME_ALREADY_STARTED }),
        { status: 409 },
      )
    }

    if (this.jugadores.size >= 10) {
      console.log(`[JOIN] rechazado — sala llena. jugadorId=${jugadorId}`)
      return new Response(
        JSON.stringify({ code: ERROR_CODES.ROOM_FULL, error: ERROR_MESSAGES.ROOM_FULL }),
        { status: 409 },
      )
    }

    // Si el jugador ya existe (reconexión HTTP antes de abrir WS)
    const existing = this.jugadores.get(jugadorId)
    if (existing) {
      console.log(`[JOIN] re-join HTTP. jugadorId=${jugadorId} nickname=${trimmed}`)
      this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))
      return new Response('OK', { status: 200 })
    }

    // Nickname duplicado (case-insensitive) — rechazar
    const nickLower = trimmed.toLowerCase()
    const nicknameConflict = Array.from(this.jugadores.values()).some(
      (j) => j.nickname.toLowerCase() === nickLower,
    )
    if (nicknameConflict) {
      console.log(`[JOIN] rechazado — nickname en uso. jugadorId=${jugadorId} nickname=${trimmed}`)
      return new Response(
        JSON.stringify({ code: ERROR_CODES.NICKNAME_TAKEN, error: ERROR_MESSAGES.NICKNAME_TAKEN }),
        { status: 409 },
      )
    }

    const jugador: Jugador = {
      id: jugadorId,
      nickname: trimmed,
      fotoKeys: [],
      puntuacion: 0,
      conectado: false,
      fotosListas: false,
      fotosAdivinadas: 0,
      uploadCount: 0,
    }

    this.jugadores.set(jugadorId, jugador)
    if (!this.host) this.host = jugadorId

    console.log(`[JOIN] nuevo jugador. jugadorId=${jugadorId} nickname=${trimmed} host=${this.host} total=${this.jugadores.size}`)
    this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))
    return new Response('OK', { status: 200 })
  }

  private async handleAuth(request: Request): Promise<Response> {
    const { jugadorId } = await request.json() as { jugadorId: string }
    if (!this.jugadores.has(jugadorId)) return new Response('Unauthorized', { status: 403 })
    return new Response('OK', { status: 200 })
  }

  /** Verificar jugadorId para upload + controlar cuota (máx MAX_FOTOS uploads) */
  private async handleAuthUpload(request: Request): Promise<Response> {
    const { jugadorId } = await request.json() as { jugadorId: string }
    const jugador = this.jugadores.get(jugadorId)
    if (!jugador) {
      return new Response(
        JSON.stringify({ code: 'UNAUTHORIZED', error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 403 },
      )
    }
    // Cuota: máx 20 fotos por jugador (equivale a MAX_FOTOS en el frontend)
    if (jugador.uploadCount >= 20) {
      return new Response(
        JSON.stringify({ code: 'UPLOAD_FAILED', error: 'Límite de fotos alcanzado para este jugador.' }),
        { status: 429 },
      )
    }
    jugador.uploadCount++
    return new Response('OK', { status: 200 })
  }

  /** Verificar que jugadorId es el host actual (para DELETE sala) */
  private async handleAuthHost(request: Request): Promise<Response> {
    const { jugadorId } = await request.json() as { jugadorId: string }
    if (!jugadorId || jugadorId !== this.host) {
      return new Response('Forbidden', { status: 403 })
    }
    return new Response('OK', { status: 200 })
  }

  private handleClose(): Response {
    this.clearTimer()
    this.broadcastRaw(JSON.stringify({ type: 'ROOM_CLOSED' }))
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

    // Si ya había una conexión anterior del mismo jugador, cerrarla limpiamente
    const prevWs = this.connections.get(jugadorId)
    if (prevWs) {
      try { prevWs.close(1000, 'Replaced by new connection') } catch { /* ignore */ }
    }
    this.connections.set(jugadorId, server)

    const jugador = this.jugadores.get(jugadorId)
    if (jugador) {
      jugador.conectado = true

      // Si no hay host activo (todos se habían desconectado), promover al primero que vuelva
      if (!this.host) {
        this.host = jugadorId
        console.log(`[WS] sin host previo — promoviendo a ${jugador.nickname} como nuevo host`)
        this.broadcast(JSON.stringify({ type: 'HOST_CHANGED', newHostId: jugadorId }))
      }

      console.log(`[WS] conectado. jugadorId=${jugadorId} nickname=${jugador.nickname} estado=${this.estado} paused=${this.gamePaused}`)

      // Enviar estado actual del lobby a todos
      this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))

      // Si el juego ya empezó, reenviar estado al jugador que (re)conecta
      const enPartida: RoomState[] = ['round_showing', 'round_results', 'game_over']
      if (enPartida.includes(this.estado) || this.gamePaused) {
        void this.sendCurrentGameState(server, jugadorId)
      }
    } else {
      // Jugador desconocido — rechazar la conexión WS inmediatamente
      console.log(`[WS] WARN: jugadorId=${jugadorId} no encontrado en la sala — cerrando WS`)
      try { server.close(1008, 'Player not in room') } catch { /* ignore */ }
      this.connections.delete(jugadorId)
    }

    server.addEventListener('message', (event) => {
      void this.handleMessage(jugadorId, event.data as string)
    })

    // Usar `server` capturado en el closure para verificar que esta WS
    // sigue siendo la activa antes de procesar la desconexión.
    // Sin esta comprobación, el close de la conexión *anterior* (reemplazada)
    // borraría la *nueva* entrada de connections.
    server.addEventListener('close', () => {
      if (this.connections.get(jugadorId) === server) {
        this.handleDisconnect(jugadorId)
      }
    })

    server.addEventListener('error', () => {
      if (this.connections.get(jugadorId) === server) {
        this.handleDisconnect(jugadorId)
      }
    })

    void this.state.storage.setAlarm(Date.now() + 30 * 60 * 1000)

    return new Response(null, { status: 101, webSocket: client })
  }

  // ─── Enviar estado del juego al reconectar ──────────────────────────────────

  private async sendCurrentGameState(ws: WebSocket, jugadorId: string): Promise<void> {
    const safeSend = (msg: string) => { try { ws.send(msg) } catch { /* ignore */ } }

    // Siempre informar cuántas rondas hay en total
    safeSend(JSON.stringify({ type: 'GAME_START', totalRondas: this.totalRondas }))

    if (this.estado === 'round_showing' || (this.gamePaused && this.fotoActual)) {
      if (!this.fotoActual) return

      const elapsedMs = Date.now() - this.roundStartTime
      // Si el juego estaba pausado, dar tiempo completo; si no, dar el tiempo restante
      const timerMs = this.gamePaused
        ? 15000
        : Math.max(3000, 15000 - elapsedMs) // mínimo 3s para que tenga tiempo de responder

      safeSend(JSON.stringify({
        type: 'ROUND_START',
        rondaNum: this.rondaActual,
        fotoUrl: this.getSignedUrl(this.fotoActual.key),
        opciones: this.currentOpciones,
        timerMs,
      }))

      // Si el juego estaba pausado, reanudarlo ahora que hay alguien conectado
      if (this.gamePaused) {
        console.log(`[RESUME] jugadorId=${jugadorId} se reconectó — reanudando juego`)
        this.gamePaused = false
        this.roundStartTime = Date.now()
        this.timerHandle = setTimeout(() => {
          void this.resolveRound()
        }, timerMs)
      }

    } else if (this.estado === 'round_results') {
      // Reenviar el último resultado de ronda
      if (this.lastRoundResultJson) safeSend(this.lastRoundResultJson)

      // Si estaba pausado tras results, avanzar a siguiente ronda
      if (this.gamePaused) {
        this.gamePaused = false
        console.log(`[RESUME] jugadorId=${jugadorId} se reconectó en round_results — avanzando`)
        await new Promise((r) => setTimeout(r, 2000))
        if (this.connections.size > 0) {
          if (this.fotosUsadas.size >= this.fotosPool.length) {
            await this.endGame()
          } else {
            await this.nextRound()
          }
        }
      }

    } else if (this.estado === 'game_over') {
      if (this.lastGameEndJson) safeSend(this.lastGameEndJson)
    }
  }

  // ─── Message handler ────────────────────────────────────────────────────────

  private async handleMessage(jugadorId: string, raw: string): Promise<void> {
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { return }

    const result = ClientWSEventSchema.safeParse(parsed)
    if (!result.success) {
      console.log(`[MSG] parse error jugadorId=${jugadorId}: ${result.error.issues[0]?.message ?? 'unknown'}`)
      return
    }

    const event = result.data
    const jugador = this.jugadores.get(jugadorId)
    if (!jugador) return

    switch (event.type) {
      case 'JOIN': {
        jugador.nickname = event.nickname
        this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))
        break
      }

      case 'FOTOS_READY': {
        // No actualizar fotos si la partida ya está en curso
        if (this.estado !== 'waiting' && this.estado !== 'lobby_ready') {
          console.log(`[FOTOS_READY] ignorado — estado=${this.estado}`)
          break
        }
        jugador.fotoKeys = event.fotoKeys
        jugador.fotosListas = true

        const listos = Array.from(this.jugadores.values()).filter((j) => j.fotosListas && j.conectado)
        console.log(`[FOTOS_READY] jugadorId=${jugadorId} fotos=${event.fotoKeys.length} listos=${listos.length}/${this.jugadores.size}`)

        this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))

        if (listos.length >= 2 && this.estado === 'waiting') {
          this.estado = 'lobby_ready'
          console.log(`[FOTOS_READY] estado → lobby_ready`)
          this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))
        }
        break
      }

      case 'START_GAME': {
        console.log(`[START_GAME] jugadorId=${jugadorId} host=${this.host} estado=${this.estado}`)
        if (jugadorId !== this.host) {
          this.sendTo(jugadorId, errorEvent('UNAUTHORIZED'))
          return
        }
        if (this.estado !== 'lobby_ready') {
          console.log(`[START_GAME] rechazado — estado=${this.estado}`)
          return
        }
        // Validar que aún hay al menos 2 jugadores conectados con fotos
        const listos = Array.from(this.jugadores.values()).filter((j) => j.fotosListas && j.conectado)
        if (listos.length < 2) {
          console.log(`[START_GAME] rechazado — solo ${listos.length} jugadores listos`)
          this.estado = 'waiting'
          this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))
          return
        }
        await this.startGame()
        break
      }

      case 'ANSWER': {
        if (this.estado !== 'round_showing') return
        if (!this.fotoActual) return
        if (this.fotoActual.propietarioId === jugadorId) return
        if (this.respuestasRonda.has(jugadorId)) return

        this.respuestasRonda.set(jugadorId, {
          propietarioId: event.propietarioId,
          tiempoMs: event.tiempoMs,
          timestamp: Date.now(),
        })

        console.log(`[ANSWER] jugadorId=${jugadorId} respuesta=${event.propietarioId} correcto=${event.propietarioId === this.fotoActual.propietarioId}`)

        // totalQueResponden = jugadores conectados que NO son el propietario
        const totalQueResponden = this.calcTotalQueResponden()

        // Notificar al propietario
        const owner = this.fotoActual.propietarioId
        this.sendTo(owner, JSON.stringify({
          type: 'PLAYER_RESPONSE_COUNT',
          count: this.respuestasRonda.size,
          total: totalQueResponden,
        }))

        // Si todos los conectados respondieron, adelantar
        if (this.respuestasRonda.size >= totalQueResponden) {
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

      case 'ABORT_GAME': {
        // Solo el host puede abortar una partida en curso
        if (jugadorId !== this.host) {
          this.sendTo(jugadorId, errorEvent('UNAUTHORIZED'))
          return
        }
        const estadosAbortables: RoomState[] = ['round_showing', 'round_results']
        if (!estadosAbortables.includes(this.estado)) return
        console.log(`[ABORT_GAME] host=${jugador.nickname} abortando partida en ronda=${this.rondaActual}`)
        await this.endGame()
        break
      }
    }
  }

  // ─── Game flow ──────────────────────────────────────────────────────────────

  private async startGame(): Promise<void> {
    this.estado = 'round_showing'
    this.gamePaused = false
    this.lastRoundResultJson = null
    this.lastGameEndJson = null

    this.fotosPool = []
    for (const jugador of this.jugadores.values()) {
      // Solo incluir fotos de jugadores con fotosListas
      if (!jugador.fotosListas) continue
      for (const key of jugador.fotoKeys) {
        this.fotosPool.push({
          key,
          propietarioId: jugador.id,
          propietarioNickname: jugador.nickname,
          url: this.getSignedUrl(key),
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

    console.log(`[startGame] totalFotos=${this.fotosPool.length} jugadores=${this.jugadores.size}`)

    this.broadcast(JSON.stringify({ type: 'GAME_START', totalRondas: this.totalRondas }))

    await new Promise((r) => setTimeout(r, 1000))
    await this.nextRound()
  }

  private async nextRound(): Promise<void> {
    // No avanzar si el juego fue pausado mientras se ejecutaba esta cadena
    if (this.gamePaused) return

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
    this.estado = 'round_showing'

    // Opciones: propietario + hasta 3 distractores (con id y nickname)
    const otrosJugadores = Array.from(this.jugadores.values())
      .filter((j) => j.id !== foto.propietarioId)

    for (let i = otrosJugadores.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[otrosJugadores[i], otrosJugadores[j]] = [otrosJugadores[j]!, otrosJugadores[i]!]
    }
    const distractors = otrosJugadores.slice(0, 3)

    const opciones: Opcion[] = [
      { id: foto.propietarioId, nickname: foto.propietarioNickname },
      ...distractors.map((j) => ({ id: j.id, nickname: j.nickname })),
    ]

    for (let i = opciones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opciones[i], opciones[j]] = [opciones[j]!, opciones[i]!]
    }

    // Guardar para reenviar a jugadores que reconecten
    this.currentOpciones = opciones
    this.roundStartTime = Date.now()
    foto.url = this.getSignedUrl(foto.key)

    console.log(`[ROUND_START] ronda=${this.rondaActual}/${this.totalRondas} propietario=${foto.propietarioNickname} opciones=[${opciones.map((o) => o.nickname).join(', ')}]`)

    this.broadcast(JSON.stringify({
      type: 'ROUND_START',
      rondaNum: this.rondaActual,
      fotoUrl: foto.url,
      opciones,
      timerMs: 15000,
    }))

    // Si no hay nadie conectado, pausar inmediatamente
    if (this.connections.size === 0) {
      console.log(`[nextRound] sin conexiones — pausando juego`)
      this.gamePaused = true
      return
    }

    this.timerHandle = setTimeout(() => {
      void this.resolveRound()
    }, 15000)
  }

  private async resolveRound(): Promise<void> {
    this.clearTimer()
    if (!this.fotoActual) return
    // Guard doble llamada (timer + última respuesta simultáneos)
    if (this.estado === 'round_results') return
    this.estado = 'round_results'

    const foto = this.fotoActual
    const puntosGanados: Record<string, number> = {}
    const respuestasCorrectas: string[] = []

    for (const [jugadorId, respuesta] of this.respuestasRonda.entries()) {
      const acierto = respuesta.propietarioId === foto.propietarioId
      if (acierto) {
        const puntos = calcPuntos(respuesta.tiempoMs)
        puntosGanados[jugadorId] = puntos
        respuestasCorrectas.push(jugadorId)
        const jugador = this.jugadores.get(jugadorId)
        if (jugador) {
          jugador.puntuacion += puntos
          jugador.fotosAdivinadas++
        }
      }
    }

    console.log(`[ROUND_RESULT] ronda=${this.rondaActual} correctas=${respuestasCorrectas.length}`)

    const rankingRonda = Array.from(this.jugadores.values())
      .map((j) => ({
        id: j.id,
        nickname: j.nickname,
        puntos: puntosGanados[j.id] ?? 0,
        puntosTotal: j.puntuacion,
      }))
      .sort((a, b) => b.puntosTotal - a.puntosTotal)

    const roundResultMsg = JSON.stringify({
      type: 'ROUND_RESULT',
      propietarioId: foto.propietarioId,
      propietarioNickname: foto.propietarioNickname,
      respuestasCorrectas,
      puntosGanados,
      rankingRonda,
    })

    // Guardar para reenviar a reconectados
    this.lastRoundResultJson = roundResultMsg
    this.broadcast(roundResultMsg)

    // Pausa 3s entre rondas
    await new Promise((r) => setTimeout(r, 3000))

    // Si todos se desconectaron durante el resultado, pausar
    if (this.connections.size === 0) {
      console.log(`[resolveRound] sin conexiones tras resultados — juego pausado`)
      this.gamePaused = true
      return
    }

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
        fotosAdivinadas: j.fotosAdivinadas,
      }))
      .sort((a, b) => b.puntosTotal - a.puntosTotal)

    console.log(`[GAME_END] ganador=${rankingFinal[0]?.nickname ?? 'nadie'} rondas=${this.rondaActual}`)

    const gameEndMsg = JSON.stringify({ type: 'GAME_END', rankingFinal })
    this.lastGameEndJson = gameEndMsg
    this.broadcast(gameEndMsg)
  }

  private async resetGame(): Promise<void> {
    this.estado = 'resetting'
    this.clearTimer()

    for (const jugador of this.jugadores.values()) {
      jugador.puntuacion = 0
      jugador.fotoKeys = []
      jugador.fotosListas = false
      jugador.fotosAdivinadas = 0
      jugador.uploadCount = 0
    }

    this.fotosPool = []
    this.fotosUsadas.clear()
    this.rondaActual = 0
    this.fotoActual = null
    this.respuestasRonda.clear()
    this.currentOpciones = []
    this.roundStartTime = 0
    this.lastRoundResultJson = null
    this.lastGameEndJson = null
    this.gamePaused = false
    this.estado = 'waiting'

    this.broadcast(JSON.stringify({ type: 'GAME_RESET' }))
    this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))
  }

  // ─── Disconnect handling ────────────────────────────────────────────────────

  private handleDisconnect(jugadorId: string): void {
    this.connections.delete(jugadorId)

    const jugador = this.jugadores.get(jugadorId)
    if (!jugador) return

    jugador.conectado = false
    console.log(`[WS] desconectado. jugadorId=${jugadorId} nickname=${jugador.nickname} conexiones=${this.connections.size}`)

    this.broadcast(JSON.stringify({
      type: 'PLAYER_DISCONNECTED',
      jugadorId,
      nickname: jugador.nickname,
    }))

    // Pasar host al siguiente jugador conectado si el host se fue
    if (jugadorId === this.host) {
      const nextHost = Array.from(this.jugadores.values()).find(
        (j) => j.conectado && j.id !== jugadorId,
      )
      if (nextHost) {
        this.host = nextHost.id
        console.log(`[HOST_CHANGED] nuevo host: ${nextHost.nickname}`)
        this.broadcast(JSON.stringify({ type: 'HOST_CHANGED', newHostId: nextHost.id }))
      } else {
        // Nadie más conectado — el host quedará pendiente para el próximo que reconecte
        this.host = null
      }
    }

    // ── Gestión de estado según la fase del juego ────────────────────────────

    if (this.estado === 'waiting' || this.estado === 'lobby_ready') {
      // Re-verificar si aún se cumplen los requisitos mínimos
      const listos = Array.from(this.jugadores.values()).filter((j) => j.fotosListas && j.conectado)
      if (listos.length < 2 && this.estado === 'lobby_ready') {
        console.log(`[DISCONNECT] lobby_ready → waiting (solo ${listos.length} listos)`)
        this.estado = 'waiting'
      }
      this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))

    } else if (this.estado === 'round_showing') {
      this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))

      if (this.connections.size === 0) {
        // Todos se desconectaron — pausar para no desperdiciar recursos
        this.clearTimer()
        this.gamePaused = true
        console.log(`[PAUSE] todos desconectados en round_showing — timer cancelado`)
      } else {
        // Re-evaluar si los que quedan conectados ya respondieron todos
        const totalQueResponden = this.calcTotalQueResponden()
        if (totalQueResponden > 0 && this.respuestasRonda.size >= totalQueResponden) {
          console.log(`[DISCONNECT] todos los conectados respondieron — adelantando ronda`)
          this.clearTimer()
          void this.resolveRound()
        } else if (totalQueResponden === 0) {
          // Solo queda el propietario conectado — avanzar automáticamente
          console.log(`[DISCONNECT] solo el propietario conectado — resolviendo`)
          this.clearTimer()
          void this.resolveRound()
        }
      }

    } else if (this.estado === 'round_results') {
      this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))
      if (this.connections.size === 0) {
        this.gamePaused = true
        console.log(`[PAUSE] todos desconectados en round_results`)
      }

    } else {
      // game_over, resetting: solo actualizar lobby
      this.broadcast(lobbyUpdateEvent(this.jugadores, this.host))
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Calcula cuántos jugadores conectados deben responder en esta ronda
   * (todos los conectados excepto el propietario de la foto)
   */
  private calcTotalQueResponden(): number {
    if (!this.fotoActual) return 0
    const ownerConnected = this.connections.has(this.fotoActual.propietarioId)
    const conectados = this.connections.size
    return ownerConnected ? conectados - 1 : conectados
  }

  private broadcast(message: string): void {
    for (const [, ws] of this.connections) {
      try { ws.send(message) } catch { /* ignore */ }
    }
  }

  private broadcastRaw(message: string): void {
    this.broadcast(message)
  }

  private sendTo(jugadorId: string, message: string): void {
    const ws = this.connections.get(jugadorId)
    if (ws) try { ws.send(message) } catch { /* ignore */ }
  }

  private clearTimer(): void {
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle)
      this.timerHandle = null
    }
  }

  private getSignedUrl(key: string): string {
    return `/api/foto/${encodeURIComponent(key)}`
  }

  // ─── DO Alarm — cleanup ───────────────────────────────────────────────────

  async alarm(): Promise<void> {
    const inactivoMs = Date.now() - this.lastActivity
    if (inactivoMs >= 30 * 60 * 1000) {
      console.log(`[ALARM] sala inactiva ${Math.round(inactivoMs / 60000)} min — limpiando`)
      // Cerrar conexiones activas
      for (const ws of this.connections.values()) {
        try { ws.close(1001, 'Inactivity timeout') } catch { /* ignore */ }
      }
      this.connections.clear()
      // Limpiar fotos de R2 para no acumular almacenamiento en el plan gratuito
      await this.cleanupR2Photos()
    } else {
      await this.state.storage.setAlarm(Date.now() + 30 * 60 * 1000)
    }
  }

  /** Borra todas las fotos de R2 asociadas a esta sala */
  private async cleanupR2Photos(): Promise<void> {
    // El código de sala se infiere del primer fotoKey guardado
    const anyKey = Array.from(this.jugadores.values())
      .flatMap((j) => j.fotoKeys)
      .find((k) => k.startsWith('fotos/'))
    if (!anyKey) return

    const parts = anyKey.split('/')
    if (parts.length < 2) return
    const codigo = parts[1]!
    const prefix = `fotos/${codigo}/`

    try {
      let cursor: string | undefined
      do {
        const listed = await this.env.PHOTOS_BUCKET.list({ prefix, cursor })
        if (listed.objects.length > 0) {
          await Promise.all(listed.objects.map((obj) => this.env.PHOTOS_BUCKET.delete(obj.key)))
          console.log(`[ALARM] borradas ${listed.objects.length} fotos de R2 (prefijo=${prefix})`)
        }
        cursor = listed.truncated ? listed.cursor : undefined
      } while (cursor)
    } catch (err) {
      console.log(`[ALARM] error limpiando R2: ${String(err)}`)
    }
  }
}
