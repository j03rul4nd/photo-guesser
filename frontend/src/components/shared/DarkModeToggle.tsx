import { useState } from 'react'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'

/**
 * DarkModeToggle — toggle de modo oscuro.
 * Aplica la clase .dark al <html>, persiste en localStorage.
 */
export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('pg_dark_mode') === '1' }
    catch { return false }
  })

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('pg_dark_mode', next ? '1' : '0') }
    catch { /* noop */ }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      style={{
        background: 'none',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '6px 10px',
        cursor: 'pointer',
        fontSize: '1rem',
        minHeight: '44px',
        minWidth: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color var(--transition-fast)',
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bg-secondary)' }}
    >
      {isDark ? <SunIcon size={18} weight="duotone" aria-hidden="true" /> : <MoonIcon size={18} weight="duotone" aria-hidden="true" />}
    </button>
  )
}
