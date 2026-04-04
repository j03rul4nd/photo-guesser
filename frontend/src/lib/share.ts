/**
 * share.ts — helpers para compartir el código/link de sala.
 * Web Share API: degradación silenciosa si no está disponible.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  ?? 'http://localhost:8787'

export function getSalaUrl(codigo: string): string {
  // En producción usa el origen del frontend, no el worker
  const origin = typeof window !== 'undefined' ? window.location.origin : API_BASE
  return `${origin}/sala/${codigo}`
}

export function getShareText(codigo: string): string {
  const url = getSalaUrl(codigo)
  return `¡Te invito a jugar a Photo Guesser! Únete con el código ${codigo} o entra aquí: ${url}`
}

/** Copia texto al portapapeles. Devuelve true si tuvo éxito. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback para navegadores sin Clipboard API
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

/** Abre WhatsApp con el mensaje de invitación. */
export function shareWhatsApp(codigo: string): void {
  const text = encodeURIComponent(getShareText(codigo))
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
}

/**
 * Usa Web Share API si está disponible (móvil).
 * Devuelve false si no está disponible — el botón no debe mostrarse.
 */
export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export async function webShare(codigo: string): Promise<void> {
  if (!canUseWebShare()) return
  const url = getSalaUrl(codigo)
  await navigator.share({
    title: 'Photo Guesser',
    text: `¡Juega conmigo! Código: ${codigo}`,
    url,
  })
}
