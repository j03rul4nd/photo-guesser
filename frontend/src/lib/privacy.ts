/**
 * privacy.ts — gestión del flag pg_privacy_seen en localStorage.
 * Todos los accesos usan try/catch: localStorage puede no estar disponible
 * (modo privado en algunos navegadores, iframe con políticas restrictivas).
 * Si no está disponible, se muestra el aviso siempre.
 */

const KEY = 'pg_privacy_seen'

export const privacy = {
  hasSeen: (): boolean => {
    try {
      return !!localStorage.getItem(KEY)
    } catch {
      return false
    }
  },

  markSeen: (): void => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // noop — si localStorage no está disponible, el aviso aparecerá siempre
    }
  },
}
