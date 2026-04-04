import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

interface PolaroidFrameProps {
  children: React.ReactNode
  caption?: string
  className?: string
  style?: CSSProperties
}

/**
 * PolaroidFrame — el objeto visual central de Photo Guesser.
 * Fondo blanco, padding inferior mayor (el borde inferior del Polaroid),
 * sombra con dirección, border-radius mínimo (2px — son fotos, no cards).
 *
 * En modo noche se añade un borde sutil via .dark CSS para legibilidad.
 */
export function PolaroidFrame({ children, caption, className, style }: PolaroidFrameProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-surface)]',
        'rounded-[var(--radius-photo)]',
        'shadow-photo',
        'p-3 pb-8',
        // En modo noche: borde sutil (definido en .dark via CSS global si se necesita)
        className
      )}
      style={style}
    >
      <div className="rounded-[var(--radius-photo)] overflow-hidden">
        {children}
      </div>

      {caption && (
        <p
          className="mt-2 text-center font-mono text-[11px] text-[var(--text-muted)] tracking-[0.08em] leading-tight"
        >
          {caption}
        </p>
      )}
    </div>
  )
}
