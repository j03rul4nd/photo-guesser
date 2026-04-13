import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, CheckIcon, LinkSimpleIcon, ShareNetworkIcon, WhatsappLogoIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ShinyText, TiltCard } from '@/components/shared/Kinetic'
import { RoomQR } from './RoomQR'
import { PrivacyNotice } from './PrivacyNotice'
import { getSalaUrl, copyToClipboard, shareWhatsApp, canUseWebShare, webShare } from '@/lib/share'
import { animateShareRoom } from '@/lib/animations'

interface ShareRoomProps {
  codigo: string
  onContinue: () => void
}

export function ShareRoom({ codigo, onContinue }: ShareRoomProps) {
  const codeRef = useRef<HTMLDivElement>(null)
  const charsRef = useRef<HTMLSpanElement[]>([])
  const qrRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    animateShareRoom(
      codeRef.current,
      charsRef.current.filter(Boolean),
      qrRef.current,
      buttonsRef.current,
    )
  }, [])

  const handleCopy = async () => {
    const ok = await copyToClipboard(getSalaUrl(codigo))
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  const chars = codigo.split('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', padding: '32px 24px', maxWidth: '460px', margin: '0 auto', minHeight: '100dvh', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>¡Sala creada!</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>Comparte el código con tus amigos</p>
      </div>

      {/* Código grande */}
      <div ref={codeRef} style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '16px 18px 18px', boxShadow: 'var(--shadow-photo)', border: '2px solid var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', width: '100%' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'clamp(2.1rem, 9vw, 3rem)', letterSpacing: '0.16em', color: 'var(--text-primary)' }}>
          {chars.map((char, i) => (
            <span key={i} ref={(el) => { if (el) charsRef.current[i] = el }}>
              <ShinyText text={char} style={{ color: 'var(--accent)' }} />
            </span>
          ))}
        </span>
        <button onClick={() => void handleCopy()} aria-label="Copiar código" style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--text-primary)', cursor: 'pointer', color: copied ? 'var(--correct)' : 'var(--text-primary)', padding: '8px', borderRadius: 'var(--radius-sm)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color var(--transition-fast)' }}>
          {copied ? <CheckIcon size={20} /> : <LinkSimpleIcon size={20} />}
        </button>
      </div>

      {/* QR */}
      <div ref={qrRef}>
        <TiltCard max={5}>
          <RoomQR codigo={codigo} />
        </TiltCard>
      </div>

      {/* Botones de compartir */}
      <div ref={buttonsRef} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <Button onClick={() => shareWhatsApp(codigo)} style={{ backgroundColor: '#25D366', color: 'var(--bg-surface)', width: '100%', gap: '8px', boxShadow: 'var(--shadow-md)', fontWeight: 700 }}>
          <WhatsappLogoIcon size={18} weight="fill" />Compartir por WhatsApp
        </Button>
        <Button variant="secondary" onClick={() => void handleCopy()} style={{ width: '100%', gap: '8px', border: '2px solid var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}>
          {copied ? <CheckIcon size={18} weight="bold" /> : <LinkSimpleIcon size={18} weight="duotone" />}{copied ? '¡Copiado!' : 'Copiar link'}
        </Button>
        {canUseWebShare() && (
          <Button variant="default" onClick={() => void webShare(codigo)} style={{ width: '100%', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
            <ShareNetworkIcon size={18} weight="duotone" />Compartir
          </Button>
        )}
      </div>

      <PrivacyNotice style={{ width: '100%' }} />
      <Button onClick={onContinue} style={{ width: '100%', boxShadow: 'var(--shadow-lg)', fontFamily: 'var(--font-display)' }} size="lg">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          Entrar al lobby
          <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
        </span>
      </Button>
    </div>
  )
}
