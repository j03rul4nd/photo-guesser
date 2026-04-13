import { X, RefreshCw } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface FotoItem {
  key: string
  previewUrl: string
  nombre: string
}

interface PhotoGridProps {
  fotos: FotoItem[]
  onRemove: (key: string) => void
  onReplace?: (key: string) => void
  /** Si true, los huecos muestran botón "Reemplazar" (modo B random) */
  showReplace?: boolean
  /** Número de huecos vacíos a mostrar (para completar la cuadrícula visual) */
  targetCount?: number
}

/**
 * PhotoGrid — grid 3 columnas de miniaturas.
 * Botón ✕ en cada foto (touch target 44px).
 * En modo B: los huecos muestran botón "Reemplazar".
 */
export function PhotoGrid({
  fotos,
  onRemove,
  onReplace,
  showReplace = false,
  targetCount = 10,
}: PhotoGridProps) {
  const huecos = targetCount - fotos.length

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
      }}
    >
      <AnimatePresence mode="popLayout">
        {fotos.map((foto) => (
          <motion.div
            key={foto.key}
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ position: 'relative', aspectRatio: '1', transform: 'rotate(0deg)' }}
          >
            <img
              src={foto.previewUrl}
              alt={foto.nombre}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 'var(--radius-photo)',
                display: 'block',
                boxShadow: 'var(--shadow-photo)',
                border: '1px solid var(--bg-surface)',
              }}
            />
            {/* Botón ✕ */}
            <button
              onClick={() => onRemove(foto.key)}
              aria-label={`Eliminar foto ${foto.nombre}`}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '32px',
                height: '32px',
                minHeight: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                border: '2px solid var(--bg-surface)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // El área táctil real es mayor via padding invisible
                padding: 0,
                // Feedback táctil
                transition: 'transform var(--transition-tactile)',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.9)' }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <X size={12} strokeWidth={3} />
            </button>
          </motion.div>
        ))}

        {/* Huecos vacíos con botón Reemplazar */}
        {showReplace &&
          onReplace &&
          fotos.length < targetCount &&
          Array.from({ length: Math.min(huecos, 3) }).map((_, i) => (
            <motion.div
              key={`hueco-${i}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ aspectRatio: '1' }}
            >
              <button
                onClick={() => onReplace(`hueco-${i}`)}
                aria-label="Reemplazar foto eliminada"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 'var(--radius-photo)',
                  border: '2px dashed var(--accent)',
                  backgroundColor: 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  minHeight: '44px',
                  transition: 'border-color var(--transition-fast)',
                  color: 'var(--accent)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              >
                <RefreshCw size={16} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem' }}>Reemplazar</span>
              </button>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}
