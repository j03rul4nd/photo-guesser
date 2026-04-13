import { useMemo, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export function InViewReveal({
  children,
  delay = 0,
  y = 20,
}: {
  children: React.ReactNode
  delay?: number
  y?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

export function SplitText({
  text,
  delay = 0,
  stagger = 0.035,
  className,
  style,
}: {
  text: string
  delay?: number
  stagger?: number
  className?: string
  style?: React.CSSProperties
}) {
  const chars = useMemo(() => text.split(''), [text])
  return (
    <span className={className} style={style}>
      {chars.map((ch, idx) => (
        <motion.span
          key={`${ch}-${idx}`}
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.28, delay: delay + idx * stagger }}
          style={{ display: 'inline-block', whiteSpace: ch === ' ' ? 'pre' : 'normal' }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

export function BlurWords({
  text,
  delay = 0,
}: {
  text: string
  delay?: number
}) {
  const words = useMemo(() => text.split(' '), [text])
  return (
    <span>
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.3, delay: delay + idx * 0.08 }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

export function ShinyText({
  text,
  style,
}: {
  text: string
  style?: React.CSSProperties
}) {
  return (
    <span
      style={{
        ...style,
        backgroundImage:
          'linear-gradient(100deg, currentColor 0%, currentColor 40%, rgba(255,255,255,0.75) 50%, currentColor 60%, currentColor 100%)',
        backgroundSize: '230% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        animation: 'kinetic-shine 3.2s linear infinite',
      }}
    >
      {text}
    </span>
  )
}

export function Magnet({
  children,
  strength = 12,
}: {
  children: React.ReactNode
  strength?: number
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  return (
    <motion.div
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const rx = (e.clientX - (rect.left + rect.width / 2)) / rect.width
        const ry = (e.clientY - (rect.top + rect.height / 2)) / rect.height
        setOffset({ x: rx * strength, y: ry * strength })
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
    >
      {children}
    </motion.div>
  )
}

export function TiltCard({
  children,
  max = 7,
}: {
  children: React.ReactNode
  max?: number
}) {
  const [rot, setRot] = useState({ x: 0, y: 0 })
  return (
    <motion.div
      style={{ transformStyle: 'preserve-3d' }}
      animate={{ rotateX: rot.x, rotateY: rot.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const py = (e.clientY - rect.top) / rect.height
        setRot({ x: (0.5 - py) * max, y: (px - 0.5) * max })
      }}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
    >
      {children}
    </motion.div>
  )
}

export function SparklesText({
  text,
  color = 'var(--accent)',
}: {
  text: string
  color?: string
}) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', color }}>
      {text}
      <span style={{ position: 'absolute', left: '-10px', top: '-8px', fontSize: '0.7rem', animation: 'sparkle-float 1.6s ease-in-out infinite' }}>+</span>
      <span style={{ position: 'absolute', right: '-8px', top: '2px', fontSize: '0.65rem', animation: 'sparkle-float 1.8s ease-in-out infinite 0.3s' }}>+</span>
    </span>
  )
}

export function WordFadeIn({
  text,
}: {
  text: string
}) {
  const words = useMemo(() => text.split(' '), [text])
  return (
    <span>
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: idx * 0.06 }}
          style={{ marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

export function AnimatedNumber({
  value,
}: {
  value: number
}) {
  const spring = useSpring(value, { stiffness: 100, damping: 28, mass: 0.8 })
  const display = useTransform(spring, (n) => Math.round(n).toLocaleString('es-ES'))
  return <motion.span>{display}</motion.span>
}

