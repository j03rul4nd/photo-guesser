import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GameRound } from '@/features/juego/components/GameRound'
import { FinalRanking } from '@/features/juego/components/FinalRanking'
import { LoadingReveal } from '@/components/shared/LoadingReveal'
import { RotatePrompt } from '@/components/shared/RotatePrompt'
import { useGameSocket } from '@/features/juego/hooks/useGameSocket'
import { useJuegoStore } from '@/features/juego/store/juegoSlice'
import type { ServerWSEvent } from '@shared/schemas'

export function GamePage() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const jugadorId = sessionStorage.getItem('pg_jugador_id') ?? ''

  useEffect(() => {
    if (!jugadorId) navigate('/')
  }, [jugadorId, navigate])

  const {
    setFotoActual,
    setFaseRonda,
    setRespuestaCount,
    setRoundResult,
    setGameOver,
    setTotalRondasPartida,
    totalRondasPartida,
    reset,
    fotoActual,
    gameOver,
    rankingFinal,
  } = useJuegoStore()

  const { jugadores, closedReason, sendMessage, lastEvent, hostId: wsHostId } = useGameSocket(code, jugadorId)
  const startTimeRef = useRef<number>(Date.now())
  const isHost = jugadorId === wsHostId
  const [showAbortConfirm, setShowAbortConfirm] = useState(false)

  // Si el jugador fue rechazado (no en sala), redirigir al inicio
  useEffect(() => {
    if (!closedReason) return
    reset()
    navigate(closedReason === 'rejected' ? '/' : '/')
  }, [closedReason, navigate, reset])

  useEffect(() => {
    if (!lastEvent) return
    processEvent(lastEvent)
  }, [lastEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  const processEvent = (event: ServerWSEvent) => {
    switch (event.type) {
      case 'GAME_START':
        // Guardar el total real de rondas para mostrarlo correctamente en el header
        setTotalRondasPartida(event.totalRondas)
        break
      case 'ROUND_START': {
        // esMiFoto: el servidor NO incluye al dueño entre las opciones de respuesta;
        // si mi ID no está en opciones → esta foto es mía
        const esMiFoto = !event.opciones.some((o) => o.id === jugadorId)
        startTimeRef.current = Date.now()
        setFotoActual(
          {
            url: event.fotoUrl,
            opciones: event.opciones,
            rondaNum: event.rondaNum,
            // Usar el totalRondas del GAME_START; como fallback usamos el del store
            totalRondas: totalRondasPartida > 0 ? totalRondasPartida : event.rondaNum,
            timerMs: event.timerMs,
          },
          esMiFoto,
        )
        break
      }
      case 'PLAYER_RESPONSE_COUNT':
        setRespuestaCount(event.count, event.total)
        break
      case 'ROUND_RESULT':
        setRoundResult({
          propietarioNickname: event.propietarioNickname,
          respuestasCorrectas: event.respuestasCorrectas,
          puntosGanados: event.puntosGanados,
          rankingRonda: event.rankingRonda,
          miId: jugadorId,
        })
        break
      case 'GAME_END':
        setGameOver(event.rankingFinal)
        break
      case 'GAME_RESET':
        reset()
        navigate(
          event.nuevoCodigo && event.nuevoCodigo !== code
            ? `/sala/${event.nuevoCodigo}/lobby`
            : `/sala/${code}/lobby`,
        )
        break
      case 'ROOM_CLOSED':
        reset()
        navigate('/')
        break
    }
  }

  const handleAnswer = (propietarioId: string, tiempoMs: number) => {
    sendMessage({ type: 'ANSWER', propietarioId, tiempoMs })
  }

  const handleTimerExpire = () => {
    setFaseRonda('result')
  }

  const handlePlayAgain = () => {
    sendMessage({ type: 'PLAY_AGAIN' })
  }

  const handleAbortGame = () => {
    sendMessage({ type: 'ABORT_GAME' })
    setShowAbortConfirm(false)
  }

  if (gameOver) {
    return (
      <>
        <RotatePrompt />
        <FinalRanking
          rankingFinal={rankingFinal}
          miId={jugadorId}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
        />
      </>
    )
  }

  if (!fotoActual) {
    return <LoadingReveal message="preparando las rondas..." style={{ minHeight: '100dvh' }} />
  }

  return (
    <>
      <RotatePrompt />
      <GameRound
        miId={jugadorId}
        onAnswer={handleAnswer}
        onTimerExpire={handleTimerExpire}
        startTimeRef={startTimeRef}
      />

      {/* Botón de abortar — solo visible para el host, esquina inferior derecha */}
      {isHost && !gameOver && (
        <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 50 }}>
          {showAbortConfirm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--bg-surface)', border: '2px solid var(--incorrect)', borderRadius: 'var(--radius-md)', padding: '14px', boxShadow: 'var(--shadow-lg)', maxWidth: '220px' }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                ¿Terminar la partida ahora?
              </p>
              <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Se mostrará el ranking con las puntuaciones actuales.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAbortGame}
                  style={{ flex: 1, padding: '8px', backgroundColor: 'var(--incorrect)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Sí, terminar
                </button>
                <button
                  onClick={() => setShowAbortConfirm(false)}
                  style={{ flex: 1, padding: '8px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAbortConfirm(true)}
              title="Terminar partida (solo host)"
              style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ✕ Terminar partida
            </button>
          )}
        </div>
      )}
    </>
  )
}
