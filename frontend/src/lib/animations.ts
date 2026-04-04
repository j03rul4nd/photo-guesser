import { gsap } from 'gsap'

/**
 * animations.ts — GSAP timelines reutilizables.
 * Separación estricta: GSAP para secuencias narrativas de juego.
 * CSS transitions para feedback táctil (no está aquí).
 * Motion para layout React (no está aquí).
 */

// ─── prefers-reduced-motion ───────────────────────────────────────────────────

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function applyReducedMotion(): void {
  if (reducedMotion) {
    gsap.globalTimeline.timeScale(0)
  }
}

// ─── Entrada de pantalla de inicio ────────────────────────────────────────────

export function animateHomeEntrance(
  logo: Element | null,
  tagline: Element | null,
  buttons: HTMLCollection | Element[],
  polaroids: Element[],
): void {
  if (reducedMotion) return
  const tl = gsap.timeline()

  // Polaroids ya están en posición — entrada sutil la primera vez
  if (polaroids.length) {
    gsap.from(polaroids, {
      opacity: 0,
      rotateZ: (i) => (i % 2 === 0 ? -12 : 12),
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
    })
  }

  tl.from(logo, {
    y: -24,
    opacity: 0,
    duration: 0.6,
    ease: 'back.out(1.4)',
  })
  tl.from(
    tagline,
    { y: 10, opacity: 0, duration: 0.4 },
    0.3,
  )
  tl.from(
    Array.from(buttons),
    {
      y: 10,
      opacity: 0,
      stagger: 0.1,
      duration: 0.4,
      ease: 'back.out(1.4)',
    },
    0.5,
  )
}

// ─── Compartir sala: flip reveal del código ───────────────────────────────────

export function animateShareRoom(
  codeBg: Element | null,
  chars: Element[],
  qrFrame: Element | null,
  buttons: Element | null,
): void {
  if (reducedMotion) return
  const tl = gsap.timeline()

  tl.from(codeBg, {
    scaleX: 0,
    duration: 0.3,
    ease: 'expo.out',
    transformOrigin: 'left center',
  })
  tl.from(
    chars.filter(Boolean),
    {
      opacity: 0,
      y: -12,
      duration: 0.04,
      stagger: 0.04,
      ease: 'back.out(1.7)',
    },
    0.2,
  )
  tl.from(
    qrFrame,
    { scale: 0.8, opacity: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' },
    0.6,
  )
  tl.from(
    buttons,
    { y: 10, opacity: 0, duration: 0.3, ease: 'back.out(1.4)' },
    0.9,
  )
}

// ─── Shake de error en formularios ────────────────────────────────────────────

export function shakeElement(el: Element | null): void {
  if (!el) return
  gsap.to(el, {
    keyframes: { x: [-6, 6, -4, 4, -2, 2, 0] },
    duration: 0.4,
    ease: 'power2.inOut',
  })
}

// ─── Transición lobby → juego ─────────────────────────────────────────────────

export function animateLobbyToGame(
  screen: Element | null,
  onComplete: () => void,
): void {
  if (reducedMotion) { onComplete(); return }
  const tl = gsap.timeline({ onComplete })
  tl.to(screen, { scale: 0.95, opacity: 0, duration: 0.2, ease: 'power2.in' })
  tl.set(screen, { scale: 1, opacity: 1 })
}

// ─── Reveal de foto — el momento más importante ───────────────────────────────

export function animatePhotoReveal(
  overlay: Element | null,
  photoEl: Element | null,
  questionEl: Element | null,
  optionEls: Element[],
): gsap.core.Timeline {
  const tl = gsap.timeline()

  if (reducedMotion) {
    gsap.set([photoEl, questionEl, ...optionEls], { opacity: 1 })
    return tl
  }

  // Asegurar estado inicial
  gsap.set([photoEl, questionEl, ...optionEls], { opacity: 0 })
  if (overlay) gsap.set(overlay, { opacity: 0 })

  tl.to(overlay, { opacity: 0.4, duration: 0.2 })
  tl.from(
    photoEl,
    { y: 60, scale: 0.92, opacity: 0, duration: 0.35, ease: 'expo.out' },
    0.2,
  )
  tl.from(
    questionEl,
    { scale: 0, opacity: 0, duration: 0.2, ease: 'elastic.out(1, 0.4)' },
    0.5,
  )
  tl.from(
    optionEls.filter(Boolean),
    {
      y: 20,
      opacity: 0,
      duration: 0.25,
      ease: 'back.out(1.4)',
      stagger: 0.06,
    },
    0.65,
  )

  return tl
}

// ─── Timer SVG con GSAP ───────────────────────────────────────────────────────

export function animateTimer(
  circle: SVGCircleElement | null,
  circumference: number,
  durationMs: number,
  onUrgent: () => void,
  onExpire: () => void,
): gsap.core.Timeline {
  if (!circle) return gsap.timeline()

  const tl = gsap.timeline()

  if (reducedMotion) {
    // Solo funcional: transición CSS (definida en Timer.tsx)
    return tl
  }

  // Primera fase: primeros 10s — power1.in
  tl.to(circle, {
    strokeDashoffset: circumference * 0.33,
    duration: (durationMs * 0.67) / 1000,
    ease: 'power1.in',
    onUpdate() {
      // Progresión de color manejada por React state en Timer.tsx
    },
  })

  // Segunda fase: últimos 5s — expo.in (urgencia creciente)
  tl.to(circle, {
    strokeDashoffset: circumference,
    duration: (durationMs * 0.33) / 1000,
    ease: 'expo.in',
    onStart: onUrgent,
    onComplete: onExpire,
  })

  return tl
}

// ─── Pulse de urgencia en timer (últimos 3s) ──────────────────────────────────

export function animateTimerUrgentPulse(el: Element | null): gsap.core.Tween | null {
  if (!el || reducedMotion) return null
  return gsap.to(el, {
    scale: 1.15,
    duration: 0.3,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: -1,
  })
}

// ─── Bump del número en timer (cada segundo) ─────────────────────────────────

export function animateTimerNumberBump(el: Element | null): void {
  if (!el || reducedMotion) return
  gsap.fromTo(
    el,
    { scale: 1.3 },
    { scale: 1, duration: 0.2, ease: 'back.out(2)' },
  )
}

// ─── ResponseDot aparece (punto de luz elastic) ───────────────────────────────

export function animateResponseDot(dot: Element | null): void {
  if (!dot || reducedMotion) return
  gsap.from(dot, {
    scale: 0.5,
    duration: 0.2,
    ease: 'elastic.out(1, 0.5)',
  })
}

// ─── Resultado de ronda ───────────────────────────────────────────────────────

export function animateRoundResult(
  wrongOptions: Element[],
  correctOption: Element | null,
  ownerLabel: Element | null,
  scoreFloats: Element[],
): gsap.core.Timeline {
  const tl = gsap.timeline()

  if (reducedMotion) {
    if (correctOption) gsap.set(correctOption, { scale: 1 })
    return tl
  }

  tl.to(wrongOptions.filter(Boolean), { opacity: 0.15, duration: 0.2 })
  tl.to(
    correctOption,
    { scale: 1.08, duration: 0.3, ease: 'expo.out' },
    0,
  )
  tl.from(
    ownerLabel,
    { y: 20, opacity: 0, duration: 0.25, ease: 'back.out(1.7)' },
    0.3,
  )
  tl.from(
    scoreFloats.filter(Boolean),
    {
      scale: 0,
      opacity: 0,
      stagger: 0.1,
      ease: 'elastic.out(1, 0.4)',
      duration: 0.4,
    },
    0.5,
  )

  return tl
}

// ─── Pantalla final ───────────────────────────────────────────────────────────

export function animateFinalScreen(
  title: Element | null,
  cards: Element[],
  winnerCard: Element | null,
): gsap.core.Timeline {
  const tl = gsap.timeline()

  if (reducedMotion) return tl

  tl.from(title, {
    y: -40,
    opacity: 0,
    duration: 0.5,
    ease: 'expo.out',
  })
  tl.from(
    cards.filter(Boolean),
    {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      ease: 'back.out(1.4)',
      duration: 0.4,
    },
    0.5,
  )
  tl.to(
    winnerCard,
    { scale: 1.04, duration: 0.3, ease: 'elastic.out(1, 0.3)' },
    0.9,
  )

  // Pulse del botón "Jugar otra vez" cada 3s (se aplica externamente)
  return tl
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

export async function burstConfetti(opts: { large?: boolean } = {}): Promise<void> {
  if (reducedMotion) return
  const confetti = (await import('canvas-confetti')).default
  const count = opts.large ? 200 : 80
  const spread = opts.large ? 70 : 50

  confetti({
    particleCount: count,
    spread,
    origin: { y: 0.6 },
    colors: ['#FF4D2E', '#F7F3EE', '#1A7A4A', '#B8860B', '#FF6040'],
  })

  if (opts.large) {
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } })
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } })
    }, 400)
  }
}
