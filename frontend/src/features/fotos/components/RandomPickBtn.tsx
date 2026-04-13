import { useRef } from 'react'

interface RandomPickBtnProps {
  onPick: (files: File[]) => void
  disabled?: boolean
}

/**
 * RandomPickBtn — botón hero full-width para selección aleatoria.
 * El dado rota 360° en CSS al activar el input de archivos.
 * El usuario selecciona desde galería; el sistema elige 10 al azar.
 */
export function RandomPickBtn({ onPick, disabled }: RandomPickBtnProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const diceRef = useRef<HTMLSpanElement>(null)

  const handleClick = () => {
    if (disabled) return
    // Rotar el dado — CSS animation una sola vez
    if (diceRef.current) {
      diceRef.current.style.animation = 'none'
      // Forzar reflow
      void diceRef.current.offsetHeight
      diceRef.current.style.animation = 'spinDice 0.4s ease-out'
    }
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    onPick(files)
    // Reset input para permitir re-selección
    e.target.value = ''
  }

  return (
    <>
      <style>{`
        @keyframes spinDice {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(200deg) scale(1.3); }
          100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: '94px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-surface)',
          border: '3px dashed var(--accent)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          // Feedback táctil CSS puro
          transition: 'transform var(--transition-tactile), background-color var(--transition-fast)',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'clamp(1.25rem, 4vw, 1.6rem)',
          color: 'var(--accent)',
          letterSpacing: '0.02em',
          boxShadow: 'var(--shadow-photo)',
          textTransform: 'uppercase',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <span
          ref={diceRef}
          style={{ fontSize: '2.1rem', display: 'inline-block' }}
          aria-hidden="true"
        >
          🎲
        </span>
        Elegir 10 fotos al azar
      </button>
    </>
  )
}
