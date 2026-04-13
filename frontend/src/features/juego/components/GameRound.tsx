import { useCallback, useEffect, useRef, useState } from 'react'
import { PolaroidFrame } from '@/components/shared/PolaroidFrame'
import { AnimatedNumber } from '@/components/shared/Kinetic'
import { Timer } from './Timer'
import { AnswerOptions } from './AnswerOptions'
import { OwnerWaiting } from './OwnerWaiting'
import { RoundResult } from './RoundResult'
import { useJuegoStore } from '../store/juegoSlice'
import { animatePhotoReveal } from '@/lib/animations'

interface GameRoundProps {
  miId: string
  onAnswer: (propietarioId: string, tiempoMs: number) => void
  onTimerExpire: () => void
  startTimeRef: React.MutableRefObject<number>
}

export function GameRound({ miId, onAnswer, onTimerExpire, startTimeRef }: GameRoundProps) {
  const {
    fotoActual,
    faseRonda,
    esMiFoto,
    respuestaSeleccionada,
    respuestaCount,
    propietarioNickname,
    respuestasCorrectas,
    puntosGanados,
    rankingActual,
  } = useJuegoStore()

  // Refs para la animación de reveal
  const overlayRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLHeadingElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const prevRondaNum = useRef<number>(0)
  const [isDesktop, setIsDesktop] = useState(false)

  // Sprint 4.2 — Timeline del reveal de foto
  useEffect(() => {
    if (!fotoActual || faseRonda !== 'showing') return
    if (fotoActual.rondaNum === prevRondaNum.current) return
    prevRondaNum.current = fotoActual.rondaNum

    if (!esMiFoto) {
      const options = Array.from(optionsRef.current?.children ?? [])
      animatePhotoReveal(
        overlayRef.current,
        photoRef.current,
        questionRef.current,
        options,
      )
    }
  }, [fotoActual?.rondaNum, faseRonda, esMiFoto])

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleSelect = useCallback(
    (opcion: string) => {
      if (faseRonda !== 'showing' || respuestaSeleccionada) return
      const tiempoMs = Date.now() - startTimeRef.current
      useJuegoStore.getState().setRespuesta(opcion)
      onAnswer(opcion, tiempoMs)
    },
    [faseRonda, respuestaSeleccionada, startTimeRef, onAnswer],
  )

  if (!fotoActual) return null

  const showResult = faseRonda === 'result'
  const showGame = !showResult

  return (
    <div
      className="game-layout"
      style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      {/* Overlay sutil para el reveal */}
      <div ref={overlayRef} style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--text-primary)', opacity: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Header fijo */}
      <header style={{ padding: '12px 20px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Ronda <AnimatedNumber value={fotoActual.rondaNum} /> / <AnimatedNumber value={fotoActual.totalRondas} />
        </span>
        {showGame && !esMiFoto && (
          <Timer duracionMs={15000} activo={faseRonda === 'showing'} onExpire={onTimerExpire} />
        )}
      </header>

      {/* Resultado */}
      {showResult && propietarioNickname && (
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <RoundResult
            propietarioNickname={propietarioNickname}
            respuestasCorrectas={respuestasCorrectas}
            puntosGanados={puntosGanados}
            rankingActual={rankingActual}
            miId={miId}
            rondaActual={fotoActual.rondaNum}
            totalRondas={fotoActual.totalRondas}
          />
        </div>
      )}

      {/* Foto propia */}
      {showGame && esMiFoto && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'center' }}>
            <PolaroidFrame style={{ maxWidth: '260px', width: '100%' }}>
              <img src={fotoActual.url} alt="Tu foto" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
            </PolaroidFrame>
          </div>
          <OwnerWaiting count={respuestaCount.count} total={respuestaCount.total} />
        </div>
      )}

      {/* Juego normal con reveal animado */}
      {showGame && !esMiFoto && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isDesktop ? 'minmax(0, 1fr) 260px' : 'minmax(0, 1fr)', padding: '20px', gap: '20px', maxWidth: '980px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Foto */}
            <div ref={photoRef} style={{ display: 'flex', justifyContent: 'center', opacity: 0 }}>
              <PolaroidFrame style={{ maxWidth: '520px', width: '100%' }}>
                <img src={fotoActual.url} alt="¿De quién es esta foto?" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              </PolaroidFrame>
            </div>

            {/* Pregunta */}
            <h2 ref={questionRef} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: 'var(--text-primary)', margin: 0, textAlign: 'center', opacity: 0 }}>
              ¿De quién es esta foto?
            </h2>

            {/* Opciones */}
            <div ref={optionsRef}>
              <AnswerOptions
                opciones={fotoActual.opciones}
                seleccionada={respuestaSeleccionada}
                correctas={respuestasCorrectas}
                faseRonda={faseRonda === 'idle' ? 'showing' : faseRonda}
                onSelect={handleSelect}
              />
            </div>
          </div>
          {isDesktop && (
            <aside style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-secondary)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: '14px', alignSelf: 'start' }}>
              <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Ranking en vivo
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {rankingActual.slice(0, 5).map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderLeft: `4px solid ${idx === 0 ? 'var(--accent)' : 'var(--bg-secondary)'}`, backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                      {idx + 1}. {item.nickname}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      {item.puntosTotal}
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
