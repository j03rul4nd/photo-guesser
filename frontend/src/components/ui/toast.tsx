import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { create } from 'zustand'

// ─── Store de toasts ──────────────────────────────────────────────────────────

type ToastVariant = 'error' | 'success' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  action?: { label: string; onClick: () => void }
}

interface ToastState {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-2), // máx 3 toasts simultáneos
        { ...toast, id: crypto.randomUUID() },
      ],
    })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// ─── Helper para disparar toasts desde cualquier sitio ───────────────────────

export const toast = {
  error: (message: string, action?: Toast['action']) =>
    useToastStore.getState().add({ message, variant: 'error', action }),
  success: (message: string, action?: Toast['action']) =>
    useToastStore.getState().add({ message, variant: 'success', action }),
  info: (message: string, action?: Toast['action']) =>
    useToastStore.getState().add({ message, variant: 'info', action }),
}

// ─── Componente Toast individual ──────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: string }> = {
  error:   { border: 'var(--incorrect)', icon: '⚠' },
  success: { border: 'var(--correct)',   icon: '✓' },
  info:    { border: 'var(--pending)',   icon: 'ℹ' },
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const { remove } = useToastStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const styles = VARIANT_STYLES[t.variant]

  useEffect(() => {
    timerRef.current = setTimeout(() => remove(t.id), 5000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [t.id, remove])

  return (
    <motion.div
      layout
      initial={{ y: 60, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        borderLeft: `3px solid ${styles.border}`,
        boxShadow: 'var(--shadow-lg)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '360px',
        width: '100%',
      }}
    >
      <span style={{ color: styles.border, fontSize: '1rem', flexShrink: 0 }}>{styles.icon}</span>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, flex: 1, lineHeight: 1.4 }}>
        {t.message}
      </p>
      {t.action && (
        <button
          onClick={() => { t.action!.onClick(); remove(t.id) }}
          style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600, color: styles.border, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', minHeight: '32px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
        >
          {t.action.label}
        </button>
      )}
      <button
        onClick={() => remove(t.id)}
        aria-label="Cerrar notificación"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', minHeight: '32px', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

// ─── Contenedor de toasts (va en el root de la app) ──────────────────────────

export function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'none',
        width: 'calc(100% - 48px)',
        maxWidth: '400px',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto', width: '100%' }}>
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
