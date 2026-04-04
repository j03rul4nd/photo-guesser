import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LoadingReveal } from '@/components/shared/LoadingReveal'
import { api } from '@/lib/api'
import { animateHomeEntrance } from '@/lib/animations'

export function HomePage() {
  const navigate = useNavigate()
  const logoRef = useRef<HTMLHeadingElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const polaroidRefs = useRef<HTMLDivElement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    animateHomeEntrance(
      logoRef.current,
      taglineRef.current,
      buttonsRef.current?.children ?? [],
      polaroidRefs.current.filter(Boolean),
    )
  }, [])

  const handleCrear = async () => {
    setLoading(true)
    setError(null)
    try {
      const { codigo } = await api.crearSala()
      navigate(`/sala/${codigo}?creator=1`)
    } catch {
      setError('No se pudo crear la sala. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingReveal message="generando tu sala..." style={{ minHeight: '100dvh' }} />
  }

  const siluetas = [
    { top: '8%', left: '-4%', rotate: '-7deg', width: '160px' },
    { top: '5%', right: '-2%', rotate: '5deg', width: '140px' },
    { bottom: '12%', left: '2%', rotate: '4deg', width: '130px' },
    { bottom: '8%', right: '-3%', rotate: '-6deg', width: '150px' },
  ]

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Siluetas Polaroid de fondo */}
      {siluetas.map((s, i) => (
        <div
          key={i}
          ref={(el) => { if (el) polaroidRefs.current[i] = el }}
          className="decorative-animation"
          style={{ position: 'absolute', top: s.top, left: 'left' in s ? s.left : undefined, right: 'right' in s ? s.right : undefined, bottom: 'bottom' in s ? s.bottom : undefined, width: s.width, transform: `rotate(${s.rotate})`, opacity: 0.08, backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', paddingBottom: '28px', boxShadow: 'var(--shadow-sm)', pointerEvents: 'none' }}
        >
          <div style={{ width: '100%', aspectRatio: '1', backgroundColor: 'var(--bg-primary)' }} />
        </div>
      ))}

      {/* Contenido */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', maxWidth: '320px', width: '100%', position: 'relative', zIndex: 1 }}>
        <h1 ref={logoRef} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.8rem', margin: 0, lineHeight: 1, textAlign: 'center', color: 'var(--text-primary)' }}>
          PHOTO <span style={{ color: 'var(--accent)' }}>GUESSER</span>
        </h1>

        <p ref={taglineRef} style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0 0 24px', textAlign: 'center' }}>
          ¿cuánto conoces a tus amigos?
        </p>

        {error && (
          <p style={{ color: 'var(--incorrect)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', margin: '0 0 8px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <div ref={buttonsRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <Button size="lg" style={{ width: '100%' }} onClick={() => void handleCrear()}>
            Crear partida
          </Button>
          <Button size="lg" variant="secondary" style={{ width: '100%' }} onClick={() => navigate('/unirse')}>
            Unirse a partida
          </Button>
        </div>
      </div>
    </div>
  )
}
