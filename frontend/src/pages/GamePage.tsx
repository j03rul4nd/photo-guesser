import { useEffect, useRef } from 'react'
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
    reset,
    fotoActual,
    gameOver,
    rankingFinal,
  } = useJuegoStore()

  const { jugadores, sendMessage, lastEvent, hostId: wsHostId } = useGameSocket(code, jugadorId)
  const startTimeRef = useRef<number>(Date.now())
  const isHost = jugadorId === wsHostId

  useEffect(() => {
    if (!lastEvent) return
    processEvent(lastEvent)
  }, [lastEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  const processEvent = (event: ServerWSEvent) => {
    switch (event.type) {
      case 'ROUND_START': {
        const miNickname = sessionStorage.getItem('pg_nickname') ?? ''
        // Si el único nombre en las opciones que NO es el nuestro existe → no es nuestra foto
        // Si nuestro nickname no aparece en las opciones → el servidor nos lo mandó como dueño
        const esMiFoto = !event.opciones.includes(miNickname)
        startTimeRef.current = Date.now()
        setFotoActual(
          {
            url: event.fotoUrl,
            opciones: event.opciones,
            rondaNum: event.rondaNum,
            totalRondas: Math.max(jugadores.length * 10, event.rondaNum),
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
    </>
  )
}
