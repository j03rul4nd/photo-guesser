import { motion } from 'framer-motion'
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

function getEstadoLabel(jugador: Jugador): string {
  if (!jugador.conectado) return '❌ Desconectado'
  if (jugador.fotosListas) return '✅ Fotos listas'
  return '⏳ Eligiendo...'
}

export function PlayerStatus({ jugador, isHost, isMe }: PlayerStatusProps) {
  const borderColor = getEstadoColor(jugador)

  return (
    <motion.div
      layout
      style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: `3px solid ${borderColor}`,
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
            fontWeight: 500,
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
              backgroundColor: 'rgba(255,77,46,0.1)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Host
          </span>
        )}
      </div>

      <motion.span
        animate={{ color: borderColor }}
        transition={{ duration: 0.2 }}
        style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: borderColor }}
      >
        {getEstadoLabel(jugador)}
      </motion.span>
    </motion.div>
  )
}
