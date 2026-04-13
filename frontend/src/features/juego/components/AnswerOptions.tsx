interface Opcion {
  id: string
  nickname: string
}

interface AnswerOptionsProps {
  opciones: Opcion[]
  seleccionada: string | null   // ID del jugador seleccionado
  correcta: string              // nickname del dueño real (en fase resultado)
  faseRonda: 'showing' | 'answered' | 'result'
  onSelect: (jugadorId: string) => void
}

function getEstadoOpcion(
  opcion: Opcion,
  seleccionada: string | null,
  correcta: string,
  fase: AnswerOptionsProps['faseRonda'],
): 'normal' | 'selected' | 'correct' | 'incorrect' | 'faded' {
  if (fase === 'showing' || fase === 'answered') {
    return opcion.id === seleccionada ? 'selected' : 'normal'
  }
  // fase === 'result'
  if (opcion.nickname === correcta) return 'correct'
  if (opcion.id === seleccionada) return 'incorrect'
  return 'faded'
}

const estadoStyles: Record<ReturnType<typeof getEstadoOpcion>, React.CSSProperties> = {
  normal: {
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--bg-surface)',
    color: 'var(--text-primary)',
    opacity: 1,
  },
  selected: {
    backgroundColor: 'var(--bg-surface)',
    border: '2px solid var(--accent)',
    color: 'var(--text-primary)',
    opacity: 1,
  },
  correct: {
    backgroundColor: 'var(--correct-bg)',
    border: '2px solid var(--correct)',
    color: 'var(--correct)',
    opacity: 1,
  },
  incorrect: {
    backgroundColor: 'var(--incorrect-bg)',
    border: '2px solid var(--incorrect)',
    color: 'var(--incorrect)',
    opacity: 0.7,
  },
  faded: {
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--bg-surface)',
    color: 'var(--text-muted)',
    opacity: 0.35,
  },
}

/**
 * AnswerOptions — 4 botones de respuesta en grid 2x2.
 * Feedback táctil: CSS scale(0.96) en 80ms — nunca GSAP ni Motion.
 * Estados de color: CSS transition 150ms.
 */
export function AnswerOptions({
  opciones,
  seleccionada,
  correcta,
  faseRonda,
  onSelect,
}: AnswerOptionsProps) {
  const puedeResponder = faseRonda === 'showing' && !seleccionada

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}
    >
      {opciones.map((opcion) => {
        const estado = getEstadoOpcion(opcion, seleccionada, correcta, faseRonda)
        const estilos = estadoStyles[estado]

        return (
          <button
            key={opcion.id}
            disabled={!puedeResponder}
            onClick={() => puedeResponder && onSelect(opcion.id)}
            className="option-feedback"
            style={{
              minHeight: '54px',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              cursor: puedeResponder ? 'pointer' : 'default',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: '1rem',
              textAlign: 'center',
              lineHeight: 1.3,
              transition:
                'transform 80ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out, opacity 200ms ease-out',
              ...estilos,
              boxShadow: estado === 'correct' || estado === 'incorrect' ? 'var(--shadow-sm)' : 'none',
            }}
            onMouseDown={(e) => {
              if (puedeResponder) e.currentTarget.style.transform = 'scale(0.96)'
            }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => {
              if (puedeResponder) e.currentTarget.style.transform = 'scale(0.96)'
            }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {opcion.nickname}
          </button>
        )
      })}
    </div>
  )
}
