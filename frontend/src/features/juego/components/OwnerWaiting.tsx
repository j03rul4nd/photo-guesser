import { ResponseDots } from './ResponseDots'
import { SparkleIcon } from '@phosphor-icons/react'
import { SplitText } from '@/components/shared/Kinetic'

interface OwnerWaitingProps {
  count: number
  total: number
}

/**
 * OwnerWaiting — pantalla que ve el dueño de la foto.
 * Muestra ResponseDots en tiempo real al recibir PLAYER_RESPONSE_COUNT.
 * Crea anticipación activa: el dueño ve cuántos están respondiendo.
 */
export function OwnerWaiting({ count, total }: OwnerWaitingProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '32px 24px',
        flex: 1,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.3rem',
            color: 'var(--text-primary)',
            margin: '0 0 6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <SparkleIcon size={20} weight="duotone" color="var(--accent)" aria-hidden="true" />
          Esta foto es tuya
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            margin: 0,
          }}
        >
          <SplitText text="¿Cuántos te conocen?" />
        </p>
      </div>

      <ResponseDots count={count} total={total} />

      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          margin: 0,
        }}
      >
        {count} / {total} han respondido
      </p>
    </div>
  )
}
