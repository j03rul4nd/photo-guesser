import { useEffect, type CSSProperties } from 'react'
import { privacy } from '@/lib/privacy'

interface PrivacyNoticeProps {
  className?: string
  style?: CSSProperties
}

export function PrivacyNotice({ className, style }: PrivacyNoticeProps) {
  if (privacy.hasSeen()) return null
  return <PrivacyNoticeInner className={className} style={style} />
}

function PrivacyNoticeInner({ className, style }: PrivacyNoticeProps) {
  useEffect(() => { privacy.markSeen() }, [])

  return (
    <div
      className={className}
      style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '3px solid var(--text-muted)',
        ...style,
      }}
    >
      <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
        Tus fotos se usan solo durante esta partida y se borran al terminar.
        Nunca las vemos ni las guardamos.
      </p>
    </div>
  )
}
