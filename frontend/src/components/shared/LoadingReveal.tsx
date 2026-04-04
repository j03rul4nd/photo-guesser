import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

interface LoadingRevealProps {
  message: string
  /** 0–100. Si no se pasa, la barra avanza sola con animación autónoma. */
  progress?: number
  className?: string
}

/**
 * LoadingReveal — estado de carga con estética de cuarto oscuro fotográfico.
 * La barra avanza con GSAP que desacelera al 80% y espera hasta resolución.
 * Cuando se pasa `progress`, la barra refleja el progreso real.
 */
export function LoadingReveal({ message, progress, className }: LoadingRevealProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    if (!barRef.current) return

    if (progress !== undefined) {
      // Progreso real: animar hasta el valor exacto
      tweenRef.current?.kill()
      gsap.to(barRef.current, {
        scaleX: progress / 100,
        duration: 0.3,
        ease: 'power2.out',
        transformOrigin: 'left center',
      })
    } else {
      // Progreso autónomo: avanza hasta 80%, desacelera, espera
      gsap.set(barRef.current, { scaleX: 0, transformOrigin: 'left center' })
      tweenRef.current = gsap.to(barRef.current, {
        scaleX: 0.8,
        duration: 1.8,
        ease: 'power3.out',
      })
    }

    return () => {
      tweenRef.current?.kill()
    }
  }, [progress])

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-5',
        'min-h-[200px] w-full px-8',
        'bg-[var(--bg-primary)]',
        className
      )}
      role="status"
      aria-label={message}
    >
      {/* Barra de progreso */}
      <div className="w-full max-w-xs h-[3px] bg-[var(--bg-secondary)] rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full bg-[var(--accent)] rounded-full"
          style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
        />
      </div>

      {/* Texto tipo máquina de escribir — animado por Motion si disponible */}
      <p className="font-mono text-sm text-[var(--text-muted)] tracking-wide text-center">
        {message}
      </p>
    </div>
  )
}
