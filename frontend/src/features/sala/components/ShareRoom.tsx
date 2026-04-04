import { useEffect, useRef, useState } from 'react'
import { Copy, MessageCircle, Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', padding: '32px 24px', maxWidth: '420px', margin: '0 auto', minHeight: '100dvh', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', margin: '0 0 4px' }}>¡Sala creada!</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>Comparte el código con tus amigos</p>
      </div>

      {/* Código grande */}
      <div ref={codeRef} style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '16px 28px', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--text-primary)' }}>
          {chars.map((char, i) => (
            <span key={i} ref={(el) => { if (el) charsRef.current[i] = el }}>{char}</span>
          ))}
        </span>
        <button onClick={() => void handleCopy()} aria-label="Copiar código" style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--correct)' : 'var(--text-muted)', padding: '8px', borderRadius: 'var(--radius-sm)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color var(--transition-fast)' }}>
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
      </div>

      {/* QR */}
      <div ref={qrRef}><RoomQR codigo={codigo} /></div>

      {/* Botones de compartir */}
      <div ref={buttonsRef} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <Button onClick={() => shareWhatsApp(codigo)} style={{ backgroundColor: '#25D366', color: 'white', width: '100%', gap: '8px' }}>
          <MessageCircle size={18} />Compartir por WhatsApp
        </Button>
        <Button variant="secondary" onClick={() => void handleCopy()} style={{ width: '100%', gap: '8px' }}>
          {copied ? <Check size={18} /> : <Copy size={18} />}{copied ? '¡Copiado!' : 'Copiar link'}
        </Button>
        {canUseWebShare() && (
          <Button variant="ghost" onClick={() => void webShare(codigo)} style={{ width: '100%', gap: '8px' }}>
            <Share2 size={18} />Compartir
          </Button>
        )}
      </div>

      <PrivacyNotice style={{ width: '100%' }} />
      <Button onClick={onContinue} style={{ width: '100%' }} size="lg">Entrar al lobby →</Button>
    </div>
  )
}
