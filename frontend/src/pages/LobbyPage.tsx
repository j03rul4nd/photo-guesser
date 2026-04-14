import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GameControllerIcon, ImagesIcon } from '@phosphor-icons/react'
import { Copy, Check, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Magnet, WordFadeIn } from '@/components/shared/Kinetic'
import { PlayerList } from '@/features/lobby/components/PlayerList'
import { PhotoSelector } from '@/features/fotos/components/PhotoSelector'
import { useLobbyStore } from '@/features/lobby/store/lobbySlice'
import { useGameSocket } from '@/features/juego/hooks/useGameSocket'
import { copyToClipboard, getSalaUrl } from '@/lib/share'
import { DarkModeToggle } from '@/components/shared/DarkModeToggle'
import { LoadingReveal } from '@/components/shared/LoadingReveal'
import type { ServerWSEvent } from '@shared/schemas'

export function LobbyPage() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const jugadorId = sessionStorage.getItem('pg_jugador_id') ?? ''
  const nickname   = sessionStorage.getItem('pg_nickname')   ?? ''
  const storedCode = sessionStorage.getItem('pg_sala_code')  ?? ''

  const { setSala } = useLobbyStore()

  useEffect(() => {
    // Sin identidad → volver al inicio
    if (!jugadorId) { navigate('/'); return }
    // El jugadorId pertenece a otra sala → redirigir a la entrada de esa sala
    if (storedCode && storedCode !== code) {
      navigate(`/sala/${storedCode}/lobby`)
      return
    }
    setSala(code, jugadorId, nickname)
  }, [code, jugadorId, nickname, storedCode, setSala, navigate])

  // ── Fuente única de verdad para jugadores y host ──────────────────────────
  const {
    estado, closedReason, jugadores, hostId,
    puedeIniciar: serverPuedeIniciar, listosCount,
    sendMessage, lastEvent,
  } = useGameSocket(code, jugadorId)

  const isHost = Boolean(jugadorId && hostId && jugadorId === hostId)
  // Usar el flag del servidor para garantizar sincronía con el estado interno del DO
  const puedeIniciar = isHost && serverPuedeIniciar

  // ── Reaccionar al motivo de cierre de WS ─────────────────────────────────
  useEffect(() => {
    if (!closedReason) return
    if (closedReason === 'rejected') {
      // El jugador no está en esta sala: limpiar sesión y redirigir a la entrada
      sessionStorage.removeItem('pg_jugador_id')
      sessionStorage.removeItem('pg_nickname')
      sessionStorage.removeItem('pg_sala_code')
      navigate(`/sala/${code}`)
    } else {
      // room_closed: sala terminó, volver al inicio
      navigate('/')
    }
  }, [closedReason, code, navigate])

  // ── Eventos del servidor que cambian de pantalla ──────────────────────────
  useEffect(() => {
    if (!lastEvent) return
    handleServerEvent(lastEvent)
  }, [lastEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleServerEvent = (event: ServerWSEvent) => {
    if (event.type === 'GAME_START') navigate(`/sala/${code}/juego`)
    if (event.type === 'ROOM_CLOSED') navigate('/')
    // HOST_CHANGED ya lo maneja useGameSocket internamente — no duplicar
  }

  // ── Share / copy ──────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false)
  const handleCopyCode = async () => {
    const ok = await copyToClipboard(getSalaUrl(code))
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  // ── Selector de fotos ─────────────────────────────────────────────────────
  const [showSelector, setShowSelector] = useState(false)

  const isDisconnected = estado === 'disconnected' || estado === 'reconnecting'

  // ── Pantalla de selección de fotos ───────────────────────────────────────
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

  // ── Pantalla de conexión inicial ─────────────────────────────────────────
  if (estado === 'connecting' && jugadores.length === 0) {
    return <LoadingReveal message="conectando a la sala..." style={{ minHeight: '100dvh' }} />
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
      <header style={{ padding: '14px 16px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-secondary)', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          PHOTO <span style={{ color: 'var(--accent)' }}>GUESSER</span>
        </span>
        <button
          onClick={() => void handleCopyCode()}
          aria-label="Copiar link de sala"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--text-primary)', borderRadius: 'var(--radius-md)', padding: '8px 12px', cursor: 'pointer', minHeight: '44px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.1em', boxShadow: 'var(--shadow-sm)' }}
        >
          {code.toUpperCase()}
          {copied ? <Check size={14} style={{ color: 'var(--correct)' }} /> : <Copy size={14} />}
        </button>
        <DarkModeToggle />
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '560px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '18px' }}>
          <Wifi size={14} style={{ color: estado === 'connected' ? 'var(--correct)' : 'var(--text-muted)' }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''} en sala
          </span>
        </div>

        <PlayerList jugadores={jugadores} hostId={hostId} miId={jugadorId} />

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            variant="secondary"
            style={{ width: '100%', border: '2px solid var(--text-primary)', boxShadow: 'var(--shadow-sm)', fontWeight: 700 }}
            onClick={() => setShowSelector(true)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ImagesIcon size={18} weight="duotone" aria-hidden="true" />
              Elegir mis fotos
            </span>
          </Button>

          {isHost && (
            <>
              {/* Banner "Eres el host" */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent)' }}>
                <GameControllerIcon size={16} weight="duotone" style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Eres el <span style={{ color: 'var(--accent)' }}>host</span> — tú decides cuándo empieza
                </span>
              </div>
              <Magnet>
                <Button
                  size="lg"
                  style={{ width: '100%', boxShadow: puedeIniciar ? 'var(--shadow-lg)' : 'none', fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}
                  disabled={!puedeIniciar}
                  onClick={() => sendMessage({ type: 'START_GAME' })}
                >
                  {puedeIniciar ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <GameControllerIcon size={18} weight="duotone" aria-hidden="true" />
                      Iniciar partida
                    </span>
                  ) : (
                    `Esperando fotos (${listosCount}/${jugadores.filter(j => j.conectado).length} jugadores)`
                  )}
                </Button>
              </Magnet>
            </>
          )}

          {!isHost && (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
              {hostId ? (
                <WordFadeIn
                  text={`El host (${jugadores.find((j) => j.id === hostId)?.nickname ?? 'host'}) iniciará la partida cuando todos estén listos`}
                />
              ) : (
                <WordFadeIn text="El host iniciará la partida cuando todos estén listos" />
              )}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
