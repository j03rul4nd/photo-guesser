import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { Button } from '@/components/ui/button'
import { animateFinalScreen, burstConfetti } from '@/lib/animations'

interface FinalRankingItem {
  id: string
  nickname: string
  puntosTotal: number
  fotosAdivinadas: number
}

interface FinalRankingProps {
  rankingFinal: FinalRankingItem[]
  miId: string
  isHost: boolean
  onPlayAgain: () => void
}

export function FinalRanking({ rankingFinal, miId, isHost, onPlayAgain }: FinalRankingProps) {
  const titleRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<HTMLDivElement[]>([])
  const winnerRef = useRef<HTMLDivElement>(null)
  const playAgainRef = useRef<HTMLButtonElement>(null)
  const [confirmando, setConfirmando] = useState(false)
  const animated = useRef(false)

  useEffect(() => {
    if (animated.current) return
    animated.current = true

    // Sprint 4.5 — Timeline pantalla final
    animateFinalScreen(titleRef.current, cardRefs.current.filter(Boolean), winnerRef.current)

    // Confetti grande
    void burstConfetti({ large: true })

    // Pulse del botón cada 3s
    if (playAgainRef.current) {
      setTimeout(() => {
        if (!playAgainRef.current) return
        gsap.to(playAgainRef.current, {
          scale: 1.04,
          duration: 0.4,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: -1,
          repeatDelay: 2.6,
        })
      }, 1500)
    }
  }, [])

  const handlePlayAgain = () => {
    if (confirmando) return
    setConfirmando(true)
    setTimeout(() => { onPlayAgain(); setConfirmando(false) }, 1500)
  }

  const ganador = rankingFinal[0]

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: '32px' }}>
      {/* Título */}
      <div ref={titleRef} style={{ textAlign: 'center', opacity: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.2rem', color: 'var(--accent)', margin: '0 0 0', lineHeight: 1 }}>FIN DE LA</h1>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.2rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>PARTIDA</h1>
        {ganador && (
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Ganador: <strong>{ganador.nickname}</strong> 🏆
          </p>
        )}
      </div>

      {/* Ranking */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '400px' }}>
        {rankingFinal.map((item, idx) => {
          const isWinner = idx === 0
          const isMe = item.id === miId
          const maxPuntos = rankingFinal[0]?.puntosTotal ?? 1
          const barWidth = `${Math.round((item.puntosTotal / maxPuntos) * 100)}%`

          return (
            <motion.div
              key={item.id}
              ref={(el) => {
                if (el) {
                  cardRefs.current[idx] = el
                  if (isWinner) winnerRef.current = el
                }
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
              style={{ padding: '16px', borderRadius: 'var(--radius-xl)', backgroundColor: isWinner ? 'var(--bg-surface)' : 'var(--bg-secondary)', boxShadow: isWinner ? 'var(--shadow-md), 0 0 20px rgba(255,200,50,0.15)' : 'none', border: isWinner ? '1px solid rgba(255,200,50,0.3)' : 'none', transform: isWinner ? 'scale(1.04)' : 'scale(1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: isWinner ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {isWinner ? '🏆' : `${idx + 1}.`} {item.nickname}
                  {isMe && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '6px' }}>(tú)</span>}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: isWinner ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {item.puntosTotal} pts
                </span>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: barWidth, backgroundColor: isWinner ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '2px', transition: 'width 0.6s ease-out' }} />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Botón jugar otra vez */}
      {isHost ? (
        <Button
          ref={playAgainRef}
          size="lg"
          style={{ width: '100%', maxWidth: '400px', transformOrigin: 'center' }}
          onClick={handlePlayAgain}
        >
          {confirmando ? '¿Seguro? Jugáis de nuevo →' : '🔄 Jugar otra vez'}
        </Button>
      ) : (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center' }}>
          Esperando al host para jugar otra vez...
        </p>
      )}
    </div>
  )
}
