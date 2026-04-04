interface PhotoProgressBarProps {
  actual: number
  total?: number
}

/**
 * PhotoProgressBar — barra de progreso estilo tira de cine.
 * Muestra "X / 10 fotos listas" con cuadros en lugar de una barra lisa.
 */
export function PhotoProgressBar({ actual, total = 10 }: PhotoProgressBarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Tira de cine */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '20px',
              borderRadius: '2px',
              backgroundColor: i < actual ? 'var(--accent)' : 'var(--bg-secondary)',
              transition: 'background-color var(--transition-fast)',
              // Muescas de tira de cine
              boxShadow:
                i < actual
                  ? 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.15)'
                  : 'inset 0 2px 0 rgba(255,255,255,0.05)',
            }}
          />
        ))}
      </div>

      {/* Label */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: actual >= total ? 'var(--correct)' : 'var(--text-muted)',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {actual < total
          ? `${actual} / ${total} fotos — faltan ${total - actual}`
          : `✓ ${actual} fotos listas`}
      </p>
    </div>
  )
}
