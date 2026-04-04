/**
 * RotatePrompt — aviso de orientación para móvil en landscape.
 * Por defecto display: none. CSS lo muestra solo en landscape + mobile.
 * No es un error: es una recomendación amable.
 */
export function RotatePrompt() {
  return (
    <div
      className="rotate-prompt fixed inset-0 z-[10000] bg-[var(--bg-primary)] hidden flex-col items-center justify-center gap-6 p-8"
      aria-live="polite"
    >
      {/* Icono de teléfono rotando — CSS animation */}
      <div
        className="text-5xl"
        style={{
          animation: 'rotatePhone 2s ease-in-out infinite',
        }}
        aria-hidden="true"
      >
        📱
      </div>

      <div className="text-center space-y-2">
        <p className="font-display font-bold text-xl text-[var(--text-primary)]">
          Gira el teléfono
        </p>
        <p className="font-body italic text-[var(--text-secondary)] text-base">
          Photo Guesser funciona mejor en vertical
        </p>
      </div>

      <style>{`
        @keyframes rotatePhone {
          0%, 100% { transform: rotate(0deg); }
          40%, 60% { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  )
}
