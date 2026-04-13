import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CheckCircleIcon, HourglassIcon, XCircleIcon } from '@phosphor-icons/react'
import { InViewReveal, ShinyText } from '@/components/shared/Kinetic'
import type { Jugador } from '@shared/schemas'

interface PlayerStatusProps {
  jugador: Jugador
  isHost: boolean
  isMe: boolean
}

function getEstadoColor(jugador: Jugador): string {
  if (!jugador.conectado) return 'var(--incorrect)'
  if (jugador.fotosListas) return 'var(--accent)'
  return 'var(--text-muted)'
}

function getEstadoLabel(jugador: Jugador): ReactNode {
  if (!jugador.conectado) {
    return (
      <>
        <XCircleIcon size={16} weight="fill" aria-hidden="true" />
        Desconectado
      </>
    )
  }
  if (jugador.fotosListas) {
    return (
      <>
        <CheckCircleIcon size={16} weight="fill" aria-hidden="true" />
        Fotos listas
      </>
    )
  }
  return (
    <>
      <HourglassIcon size={16} weight="duotone" aria-hidden="true" />
      Eligiendo...
    </>
  )
}

export function PlayerStatus({ jugador, isHost, isMe }: PlayerStatusProps) {
  const borderColor = getEstadoColor(jugador)

  return (
    <InViewReveal>
      <motion.div
      layout
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: `4px solid ${borderColor}`,
        border: '1px solid var(--bg-secondary)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'border-color var(--transition-normal)',
      }}
      >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
              fontWeight: 700,
            color: 'var(--text-primary)',
            fontSize: '1rem',
          }}
        >
          {jugador.nickname}
          {isMe && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '6px' }}>
              (tú)
            </span>
          )}
        </span>
        {isHost && (
          <span
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-ui)',
              color: 'var(--accent)',
              backgroundColor: 'var(--bg-primary)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <ShinyText text="Host" style={{ color: 'var(--accent)' }} />
          </span>
        )}
      </div>

      <motion.span
        animate={{ color: borderColor }}
        transition={{ duration: 0.2 }}
        style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: borderColor, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        {getEstadoLabel(jugador)}
      </motion.span>
      </motion.div>
    </InViewReveal>
  )
}
