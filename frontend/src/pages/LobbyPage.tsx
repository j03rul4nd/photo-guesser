import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Copy, Check, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlayerList } from '@/features/lobby/components/PlayerList'
import { PhotoSelector } from '@/features/fotos/components/PhotoSelector'
import { useLobbyStore } from '@/features/lobby/store/lobbySlice'
import { useGameSocket } from '@/features/juego/hooks/useGameSocket'
import { copyToClipboard, getSalaUrl } from '@/lib/share'
import { DarkModeToggle } from '@/components/shared/DarkModeToggle'
import type { ServerWSEvent } from '@shared/schemas'

export function LobbyPage() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const jugadorId = sessionStorage.getItem('pg_jugador_id') ?? ''
  const nickname = sessionStorage.getItem('pg_nickname') ?? ''

  const { setSala, jugadores, setJugadores, hostId, setHostId } = useLobbyStore()

  useEffect(() => {
    if (!jugadorId) { navigate('/'); return }
    setSala(code, jugadorId, nickname)
  }, [code, jugadorId, nickname, setSala, navigate])

  const { estado, jugadores: wsJugadores, hostId: wsHostId, sendMessage, lastEvent } =
    useGameSocket(code, jugadorId)

  useEffect(() => {
    if (wsJugadores.length > 0) setJugadores(wsJugadores)
  }, [wsJugadores, setJugadores])

  useEffect(() => {
    if (wsHostId) setHostId(wsHostId)
  }, [wsHostId, setHostId])

  useEffect(() => {
    if (!lastEvent) return
    handleServerEvent(lastEvent)
  }, [lastEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleServerEvent = (event: ServerWSEvent) => {
    if (event.type === 'GAME_START') navigate(`/sala/${code}/juego`)
    if (event.type === 'HOST_CHANGED') setHostId(event.newHostId)
  }

  const [copied, setCopied] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(getSalaUrl(code))
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  const isHost = jugadorId === hostId
  const listosCount = jugadores.filter((j) => j.fotosListas && j.conectado).length
  const puedeIniciar = isHost && listosCount >= 2
  const isDisconnected = estado === 'disconnected' || estado === 'reconnecting'

  // Mostrar PhotoSelector cuando el jugador quiere elegir fotos
  if (showSelector) {
    return (
      <PhotoSelector
        salaCode={code}
        jugadorId={jugadorId}
        onConfirm={(msg) => sendMessage(msg)}
        onClose={() => setShowSelector(false)}
      />
    )
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Banner reconexión */}
      {isDisconnected && (
        <div style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '2px solid var(--pending)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WifiOff size={16} style={{ color: 'var(--pending)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {estado === 'reconnecting' ? 'Reconectando...' : 'Sin conexión. La partida continúa.'}
          </span>
        </div>
      )}

      {/* Header */}
      <header style={{ padding: '16px 20px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          PHOTO <span style={{ color: 'var(--accent)' }}>GUESSER</span>
        </span>
        <button
          onClick={() => void handleCopyCode()}
          aria-label="Copiar link de sala"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '6px 12px', cursor: 'pointer', minHeight: '44px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.1em' }}
        >
          {code.toUpperCase()}
          {copied ? <Check size={14} style={{ color: 'var(--correct)' }} /> : <Copy size={14} />}
        </button>
        <DarkModeToggle />
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <Wifi size={14} style={{ color: estado === 'connected' ? 'var(--correct)' : 'var(--text-muted)' }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''} en sala
          </span>
        </div>

        <PlayerList jugadores={jugadores} hostId={hostId} miId={jugadorId} />

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button variant="secondary" style={{ width: '100%' }} onClick={() => setShowSelector(true)}>
            📸 Elegir mis fotos
          </Button>

          {isHost && (
            <Button size="lg" style={{ width: '100%' }} disabled={!puedeIniciar} onClick={() => sendMessage({ type: 'START_GAME' })}>
              {puedeIniciar ? '🎮 Iniciar partida' : `Esperando fotos (${listosCount}/2 mínimo)`}
            </Button>
          )}

          {!isHost && (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
              El host iniciará la partida cuando todos estén listos
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
