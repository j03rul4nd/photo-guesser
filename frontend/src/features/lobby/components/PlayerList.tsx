import { AnimatePresence, motion } from 'framer-motion'
import type { Jugador } from '@shared/schemas'
import { PlayerStatus } from './PlayerStatus'

interface PlayerListProps {
  jugadores: Jugador[]
  hostId: string | null
  miId: string
}

export function PlayerList({ jugadores, hostId, miId }: PlayerListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <AnimatePresence mode="popLayout">
        {jugadores.map((j) => (
          <motion.div
            key={j.id}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <PlayerStatus
              jugador={j}
              isHost={j.id === hostId}
              isMe={j.id === miId}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {jugadores.length === 0 && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '24px 0',
          }}
        >
          Esperando jugadores...
        </p>
      )}
    </div>
  )
}
