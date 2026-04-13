import { useEffect, useRef } from 'react'
import { CheckCircleIcon, EyeIcon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedNumber, InViewReveal, SplitText } from '@/components/shared/Kinetic'
import type { RankingItem } from '@shared/schemas'
import { animateRoundResult, burstConfetti } from '@/lib/animations'

interface RoundResultProps {
  propietarioNickname: string
  respuestasCorrectas: string[]
  puntosGanados: Record<string, number>
  rankingActual: RankingItem[]
  miId: string
  rondaActual: number
  totalRondas: number
}

export function RoundResult({ propietarioNickname, respuestasCorrectas, puntosGanados, rankingActual, miId, rondaActual, totalRondas }: RoundResultProps) {
  const wrongOptsRef = useRef<HTMLButtonElement[]>([])
  const correctOptRef = useRef<HTMLDivElement>(null)
  const ownerLabelRef = useRef<HTMLDivElement>(null)
  const scoreFloatsRef = useRef<HTMLSpanElement[]>([])
  const animated = useRef(false)

  const youAcertaste = respuestasCorrectas.includes(miId)

  useEffect(() => {
    if (animated.current) return
    animated.current = true

    animateRoundResult(
      wrongOptsRef.current.filter(Boolean),
      correctOptRef.current,
      ownerLabelRef.current,
      scoreFloatsRef.current.filter(Boolean),
    )

    if (youAcertaste) {
      void burstConfetti({ large: false })
    }
  }, [youAcertaste])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
      {/* Propietario */}
      <div ref={ownerLabelRef} style={{ textAlign: 'center', padding: '20px 16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-photo)', border: '2px solid var(--text-primary)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.6rem, 6vw, 2.3rem)', margin: '0 0 4px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Era de <span style={{ color: 'var(--accent)' }}><SplitText text={propietarioNickname} /></span>
        </p>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          Ronda {rondaActual} de {totalRondas}
        </p>
      </div>

      {/* Quién acertó */}
      {respuestasCorrectas.length > 0 ? (
        <div ref={correctOptRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Acertaron</p>
          {rankingActual.filter((r) => respuestasCorrectas.includes(r.id)).map((r, i) => (
            <InViewReveal key={r.id} delay={i * 0.06}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--correct-bg)', border: '2px solid var(--correct)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--correct)' }}>
                <CheckCircleIcon size={15} weight="fill" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} aria-hidden="true" />
                {r.nickname} {r.id === miId && '(tú)'}
              </span>
              <span ref={(el) => { if (el) scoreFloatsRef.current[i] = el }} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--correct)' }}>
                +<AnimatedNumber value={puntosGanados[r.id] ?? 0} />
              </span>
              </div>
            </InViewReveal>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', margin: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <EyeIcon size={18} weight="duotone" color="var(--text-muted)" aria-hidden="true" />
          Nadie acertó esta ronda
        </p>
      )}

      {/* Ranking con Motion layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clasificación</p>
        <AnimatePresence mode="popLayout">
          {rankingActual.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: idx * 0.05 }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${idx === 0 ? 'var(--accent)' : 'var(--bg-secondary)'}`, boxShadow: 'var(--shadow-sm)' }}
            >
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9rem', color: idx === 0 ? 'var(--accent)' : 'var(--text-primary)', fontWeight: idx === 0 ? 700 : 400 }}>
                {idx + 1}. {item.nickname} {item.id === miId && '(tú)'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <AnimatedNumber value={item.puntosTotal} /> pts
                {(puntosGanados[item.id] ?? 0) > 0 && (
                  <span style={{ color: 'var(--correct)', marginLeft: '4px', fontSize: '0.75rem' }}>+<AnimatedNumber value={puntosGanados[item.id]} /></span>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
