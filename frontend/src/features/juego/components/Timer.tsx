import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { animateTimerUrgentPulse, animateTimerNumberBump } from '@/lib/animations'

interface TimerProps {
  duracionMs: number
  onExpire: () => void
  activo: boolean
}

const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getTimerColor(secsLeft: number, total: number): string {
  const ratio = secsLeft / total
  if (ratio > 0.4) return 'var(--text-secondary)'
  if (ratio > 0.2) return 'var(--accent)'
  return 'var(--timer-urgent)'
}

export function Timer({ duracionMs, onExpire, activo }: TimerProps) {
  const totalSecs = duracionMs / 1000
  const [secsLeft, setSecsLeft] = useState(totalSecs)
  const circleRef = useRef<SVGCircleElement>(null)
  const numberRef = useRef<HTMLSpanElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gsapTweenRef = useRef<gsap.core.Tween | null>(null)
  const pulseTweenRef = useRef<gsap.core.Tween | null>(null)
  const startRef = useRef<number>(Date.now())
  const expiredRef = useRef(false)
  const lastBumpSec = useRef<number>(-1)
  const urgentStarted = useRef(false)

  const stopAll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    gsapTweenRef.current?.kill()
    pulseTweenRef.current?.kill()
  }, [])

  useEffect(() => {
    if (!activo) { stopAll(); return }

    expiredRef.current = false
    urgentStarted.current = false
    lastBumpSec.current = -1
    startRef.current = Date.now()
    setSecsLeft(totalSecs)

    // Reset circle
    if (circleRef.current) {
      gsap.set(circleRef.current, { strokeDashoffset: 0 })
    }
    pulseTweenRef.current?.kill()

    // GSAP animation del trazo SVG
    // Primera fase: 0–10s → power1.in
    // Segunda fase: 10–15s → expo.in
    const tl = gsap.timeline()
    if (circleRef.current) {
      tl.to(circleRef.current, {
        strokeDashoffset: CIRCUMFERENCE * 0.67,
        duration: totalSecs * 0.67,
        ease: 'power1.in',
      })
      tl.to(circleRef.current, {
        strokeDashoffset: CIRCUMFERENCE,
        duration: totalSecs * 0.33,
        ease: 'expo.in',
      })
    }

    // Interval para actualizar el número y disparar efectos
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const left = Math.max(0, totalSecs - elapsed)
      setSecsLeft(left)

      const displaySec = Math.ceil(left)

      // Bump en cada segundo entero
      if (displaySec !== lastBumpSec.current && displaySec < totalSecs) {
        lastBumpSec.current = displaySec
        animateTimerNumberBump(numberRef.current)
      }

      // Pulse de urgencia en los últimos 3s
      if (left <= 3 && !urgentStarted.current) {
        urgentStarted.current = true
        pulseTweenRef.current = animateTimerUrgentPulse(numberRef.current)
      }

      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true
        stopAll()
        onExpire()
      }
    }, 100)

    return () => stopAll()
  }, [activo, duracionMs, totalSecs, onExpire, stopAll])

  const color = getTimerColor(secsLeft, totalSecs)
  const displaySecs = Math.ceil(secsLeft)

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`${displaySecs} segundos restantes`}
      style={{ position: 'relative', width: '52px', height: '52px' }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r={RADIUS} fill="none" stroke="var(--bg-secondary)" strokeWidth="4" />
        <circle
          ref={circleRef}
          cx="26" cy="26" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={0}
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
      <span
        ref={numberRef}
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color, transition: 'color 0.3s ease', transformOrigin: 'center' }}
      >
        {displaySecs}
      </span>
    </div>
  )
}
