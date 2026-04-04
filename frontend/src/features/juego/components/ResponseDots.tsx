import { useEffect, useRef } from 'react'
import { animateResponseDot } from '@/lib/animations'

interface ResponseDotsProps {
  count: number
  total: number
}

export function ResponseDots({ count, total }: ResponseDotsProps) {
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevCount = useRef(0)

  // Sprint 4.3 — elastic pop cuando un punto pasa a respondido
  useEffect(() => {
    if (count > prevCount.current) {
      // El dot que acaba de activarse
      const newIdx = count - 1
      animateResponseDot(dotRefs.current[newIdx] ?? null)
    }
    prevCount.current = count
  }, [count])

  if (total === 0) return null

  return (
    <div
      aria-label={`${count} de ${total} jugadores han respondido`}
      style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const respondido = i < count
        return (
          <div
            key={i}
            ref={(el) => { dotRefs.current[i] = el }}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: respondido ? 'var(--accent)' : 'var(--bg-secondary)',
              boxShadow: respondido ? '0 0 8px var(--accent-glow)' : 'none',
              border: `2px solid ${respondido ? 'var(--accent)' : 'var(--text-muted)'}`,
              transition: 'background-color 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
              animation: respondido ? 'none' : 'dotPulse 1.5s ease-in-out infinite',
              transformOrigin: 'center',
            }}
          />
        )
      })}
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
