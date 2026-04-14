import { useEffect, useRef, useCallback, useState } from 'react'
import { ServerWSEventSchema, ClientWSEventSchema } from '@shared/schemas'
import type { ServerWSEvent, ClientWSEvent, Jugador } from '@shared/schemas'
import { getWsUrl } from '@/lib/api'

type ConexionEstado = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

/** Por qué se cerró la conexión sin posibilidad de reconectar */
type ClosedReason =
  | null           // normal — puede reconectar o aún conectando
  | 'rejected'     // 1008: el jugador no está registrado en la sala
  | 'room_closed'  // ROOM_CLOSED event o 1001: sala cerrada por el servidor/host

interface UseGameSocketReturn {
  estado: ConexionEstado
  closedReason: ClosedReason
  jugadores: Jugador[]
  hostId: string | null
  /** Refleja el estado interno del DO: true solo cuando estado === 'lobby_ready' */
  puedeIniciar: boolean
  /** Cuántos jugadores tienen fotosListas && conectado (según el DO) */
  listosCount: number
  sendMessage: (msg: ClientWSEvent) => void
  lastEvent: ServerWSEvent | null
}

const BACKOFF_MS = [1000, 2000, 4000, 8000, 10000]

export function useGameSocket(salaCode: string, jugadorId: string): UseGameSocketReturn {
  const [estado, setEstado] = useState<ConexionEstado>('connecting')
  const [closedReason, setClosedReason] = useState<ClosedReason>(null)
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hostId, setHostId] = useState<string | null>(null)
  const [puedeIniciar, setPuedeIniciar] = useState(false)
  const [listosCount, setListosCount] = useState(0)
  const [lastEvent, setLastEvent] = useState<ServerWSEvent | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const attemptRef = useRef(0)
  const unmountedRef = useRef(false)
  const roomClosedRef = useRef(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (unmountedRef.current) return
    if (!salaCode || !jugadorId) return

    setEstado(attemptRef.current === 0 ? 'connecting' : 'reconnecting')

    const url = getWsUrl(salaCode, jugadorId)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (unmountedRef.current) { ws.close(); return }
      attemptRef.current = 0
      setEstado('connected')
    }

    ws.onmessage = (event) => {
      if (unmountedRef.current) return
      let raw: unknown
      try { raw = JSON.parse(event.data as string) } catch { return }

      const result = ServerWSEventSchema.safeParse(raw)
      if (!result.success) return // descartar silenciosamente

      const msg = result.data
      setLastEvent(msg)

      // Actualizar estado local según tipo de evento
      if (msg.type === 'LOBBY_UPDATE') {
        setJugadores(msg.jugadores)
        if (msg.hostId) setHostId(msg.hostId)
        setPuedeIniciar(msg.puedeIniciar)
        setListosCount(msg.listosCount)
      }
      if (msg.type === 'HOST_CHANGED') {
        setHostId(msg.newHostId)
      }
      if (msg.type === 'ROOM_CLOSED') {
        // Sala cerrada definitivamente — no reconectar
        roomClosedRef.current = true
        ws.close()
      }
    }

    ws.onclose = (event) => {
      if (unmountedRef.current) return

      // Si ya hay otra WS activa (p.ej. reconexión que ganó la carrera),
      // ignorar el close de la WS reemplazada para no anular el estado correcto.
      if (wsRef.current !== null && wsRef.current !== ws) return

      setEstado('disconnected')
      wsRef.current = null

      // No reconectar si ya teníamos una razón de cierre
      if (roomClosedRef.current) {
        // ROOM_CLOSED mensaje ya procesado — notificar si no lo habíamos hecho
        setClosedReason((prev) => prev ?? 'room_closed')
        return
      }

      // 1008 = Policy Violation: jugador no en sala / no autorizado
      if (event.code === 1008) {
        roomClosedRef.current = true
        setClosedReason('rejected')
        return
      }

      // 1001 = Going Away: sala cerrada activamente por el servidor
      if (event.code === 1001) {
        roomClosedRef.current = true
        setClosedReason('room_closed')
        return
      }

      // Reconexión con backoff exponencial para desconexiones transitorias
      const delay = BACKOFF_MS[Math.min(attemptRef.current, BACKOFF_MS.length - 1)] ?? 10000
      attemptRef.current++
      reconnectTimerRef.current = setTimeout(() => {
        if (!unmountedRef.current) connect()
      }, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [salaCode, jugadorId])

  useEffect(() => {
    unmountedRef.current = false
    roomClosedRef.current = false
    setClosedReason(null)
    setPuedeIniciar(false)
    setListosCount(0)
    connect()

    return () => {
      unmountedRef.current = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // evitar reconexión en unmount
        wsRef.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((msg: ClientWSEvent) => {
    // Validar antes de enviar
    const parsed = ClientWSEventSchema.safeParse(msg)
    if (!parsed.success) return
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(parsed.data))
    }
  }, [])

  return { estado, closedReason, jugadores, hostId, puedeIniciar, listosCount, sendMessage, lastEvent }
}
