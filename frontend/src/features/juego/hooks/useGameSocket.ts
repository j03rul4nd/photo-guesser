import { useEffect, useRef, useCallback, useState } from 'react'
import { ServerWSEventSchema, ClientWSEventSchema } from '@shared/schemas'
import type { ServerWSEvent, ClientWSEvent, Jugador } from '@shared/schemas'
import { getWsUrl } from '@/lib/api'

type ConexionEstado = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface UseGameSocketReturn {
  estado: ConexionEstado
  jugadores: Jugador[]
  hostId: string | null
  sendMessage: (msg: ClientWSEvent) => void
  lastEvent: ServerWSEvent | null
}

const BACKOFF_MS = [1000, 2000, 4000, 8000, 10000]

export function useGameSocket(salaCode: string, jugadorId: string): UseGameSocketReturn {
  const [estado, setEstado] = useState<ConexionEstado>('connecting')
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [hostId, setHostId] = useState<string | null>(null)
  const [lastEvent, setLastEvent] = useState<ServerWSEvent | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const attemptRef = useRef(0)
  const unmountedRef = useRef(false)
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
      }
      if (msg.type === 'HOST_CHANGED') {
        setHostId(msg.newHostId)
      }
    }

    ws.onclose = () => {
      if (unmountedRef.current) return
      setEstado('disconnected')
      wsRef.current = null

      // Reconexión con backoff exponencial
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

  return { estado, jugadores, hostId, sendMessage, lastEvent }
}
