import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRightIcon } from '@phosphor-icons/react'
import { shakeElement } from '@/lib/animations'
import { Button } from '@/components/ui/button'
import { ShareRoom } from '@/features/sala/components/ShareRoom'
import { PrivacyNotice } from '@/features/sala/components/PrivacyNotice'
import { LoadingReveal } from '@/components/shared/LoadingReveal'
import { api } from '@/lib/api'

/**
 * SalaPage — el usuario llega desde un link directo /sala/:code.
 *
 * Flujo del CREADOR (creator=1):
 *   1. Introduce nickname → llama /join → guarda jugadorId → queda como HOST
 *   2. Se muestra ShareRoom para que comparta el link mientras espera a los demás
 *   3. Cuando pulsa "Continuar" → navega al lobby
 *
 * Flujo del INVITADO:
 *   1. Introduce nickname → llama /join → navega directo al lobby
 *
 * Motivo del cambio: antes el creador veía ShareRoom primero (sin hacer join),
 * por lo que cualquier invitado que se uniese antes adquiría el rol de host.
 */
export function SalaPage() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const nicknameRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // El creador hace join primero, después ve ShareRoom
  const isCreator = new URLSearchParams(window.location.search).get('creator') === '1'
  const [showShare, setShowShare] = useState(false)  // siempre false hasta que haga join

  useEffect(() => {
    nicknameRef.current?.focus()
  }, [])

  const shakeForm = () => shakeElement(formRef.current)

  const handleSubmit = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) {
      shakeForm()
      setError('Escribe tu nombre para continuar')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { jugadorId } = await api.unirse(code, trimmed)
      sessionStorage.setItem('pg_jugador_id', jugadorId)
      sessionStorage.setItem('pg_nickname', trimmed)
      sessionStorage.setItem('pg_sala_code', code)

      if (isCreator) {
        // El creador ya está registrado como host — ahora muestra la pantalla para compartir
        setShowShare(true)
        setLoading(false)
      } else {
        navigate(`/sala/${code}/lobby`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al unirse'
      setError(msg)
      shakeForm()
      setLoading(false)
    }
  }

  // El creador ya hizo join y ahora comparte el link
  if (showShare) {
    return (
      <ShareRoom
        codigo={code}
        onContinue={() => navigate(`/sala/${code}/lobby`)}
      />
    )
  }

  if (loading) {
    return <LoadingReveal message="conectando con la sala..." style={{ minHeight: '100dvh' }} />
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}
    >
      <div ref={formRef} style={{ width: '100%', maxWidth: '390px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(1.8rem, 7vw, 2.3rem)',
              margin: '0 0 4px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {isCreator ? 'Tu partida' : 'Unirse a la sala'}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            {isCreator
              ? 'Pon tu nombre para reservar tu plaza de host'
              : 'Escribe tu nombre para entrar'}
          </p>
        </div>

        {/* Código readonly */}
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Sala
          </label>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 'clamp(1.8rem, 6vw, 2rem)',
              letterSpacing: '0.15em',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              border: '2px solid var(--text-primary)',
              textAlign: 'center',
              minHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-photo)',
            }}
          >
            {code.toUpperCase()}
          </div>
        </div>

        {/* Nickname */}
        <div>
          <label
            htmlFor="nickname"
            style={{
              display: 'block',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Tu nombre
          </label>
          <input
            ref={nicknameRef}
            id="nickname"
            type="text"
            maxLength={20}
            placeholder="¿Cómo te llamas?"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }}
            style={{
              width: '100%',
              fontFamily: 'var(--font-ui)',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-surface)',
              border: `2px solid ${error ? 'var(--incorrect)' : 'var(--text-primary)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              outline: 'none',
              minHeight: '52px',
              boxSizing: 'border-box',
              transition: 'border-color var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--text-primary)' }}
          />
          {error && (
            <p style={{ color: 'var(--incorrect)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', margin: '6px 0 0' }}>
              {error}
            </p>
          )}
        </div>

        <PrivacyNotice />

        <Button
          size="lg"
          style={{ width: '100%', boxShadow: 'var(--shadow-md)', fontFamily: 'var(--font-display)' }}
          onClick={() => void handleSubmit()}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {isCreator ? 'Crear y entrar' : 'Entrar'}
            <ArrowRightIcon size={16} weight="bold" aria-hidden="true" />
          </span>
        </Button>
      </div>
    </div>
  )
}
