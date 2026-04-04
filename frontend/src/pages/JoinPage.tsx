import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shakeElement } from '@/lib/animations'
import { Button } from '@/components/ui/button'
import { PrivacyNotice } from '@/features/sala/components/PrivacyNotice'
import { LoadingReveal } from '@/components/shared/LoadingReveal'
import { api } from '@/lib/api'

/**
 * JoinPage — Escenario B: el usuario llega desde "Unirse a partida".
 * Campo código + campo nickname. Auto-uppercase en código.
 * Shake GSAP en error de código inválido.
 */
export function JoinPage() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLDivElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [nicknameError, setNicknameError] = useState<string | null>(null)

  const shakeForm = () => {
    shakeElement(formRef.current)
  }

  const handleSubmit = async () => {
    let hasError = false

    if (!code.trim()) {
      setCodeError('Introduce el código de sala')
      hasError = true
    } else {
      setCodeError(null)
    }

    if (!nickname.trim()) {
      setNicknameError('Escribe tu nombre para continuar')
      hasError = true
    } else {
      setNicknameError(null)
    }

    if (hasError) {
      shakeForm()
      return
    }

    setLoading(true)
    try {
      const normalizedCode = code.trim().toUpperCase()
      const { jugadorId } = await api.unirse(normalizedCode, nickname.trim())
      sessionStorage.setItem('pg_jugador_id', jugadorId)
      sessionStorage.setItem('pg_nickname', nickname.trim())
      sessionStorage.setItem('pg_sala_code', normalizedCode)
      navigate(`/sala/${normalizedCode}/lobby`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al unirse'
      // Si el error es de sala (código incorrecto), lo mostramos en el campo de código
      setCodeError(msg)
      shakeForm()
      if (codeInputRef.current) {
        codeInputRef.current.style.borderColor = 'var(--incorrect)'
      }
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingReveal message="conectando con la sala..." style={{ minHeight: '100dvh' }} />
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--font-ui)',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-surface)',
    border: '2px solid var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    outline: 'none',
    minHeight: '48px',
    boxSizing: 'border-box' as const,
    transition: 'border-color var(--transition-fast)',
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
      <div
        ref={formRef}
        style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.6rem',
              margin: '0 0 4px',
              color: 'var(--text-primary)',
            }}
          >
            Unirse a partida
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            Introduce el código y tu nombre
          </p>
        </div>

        {/* Campo código */}
        <div>
          <label
            htmlFor="code"
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
            Código de sala
          </label>
          <input
            ref={codeInputRef}
            id="code"
            type="text"
            maxLength={7}
            placeholder="ABCD123"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setCodeError(null)
              e.currentTarget.style.borderColor = 'var(--bg-secondary)'
            }}
            onFocus={(e) => { if (!codeError) e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { if (!codeError) e.currentTarget.style.borderColor = 'var(--bg-secondary)' }}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }}
            style={{
              ...inputBase,
              fontFamily: 'var(--font-mono)',
              fontSize: '1.6rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              borderColor: codeError ? 'var(--incorrect)' : 'var(--bg-secondary)',
            }}
          />
          {codeError && (
            <p style={{ color: 'var(--incorrect)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', margin: '6px 0 0' }}>
              {codeError}
            </p>
          )}
        </div>

        {/* Campo nickname */}
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
            id="nickname"
            type="text"
            maxLength={20}
            placeholder="¿Cómo te llamas?"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              setNicknameError(null)
            }}
            onFocus={(e) => { if (!nicknameError) e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { if (!nicknameError) e.currentTarget.style.borderColor = 'var(--bg-secondary)' }}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }}
            style={{
              ...inputBase,
              borderColor: nicknameError ? 'var(--incorrect)' : 'var(--bg-secondary)',
            }}
          />
          {nicknameError && (
            <p style={{ color: 'var(--incorrect)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', margin: '6px 0 0' }}>
              {nicknameError}
            </p>
          )}
        </div>

        <PrivacyNotice />

        <Button
          size="lg"
          style={{ width: '100%' }}
          disabled={!code.trim() || !nickname.trim()}
          onClick={() => void handleSubmit()}
        >
          Entrar →
        </Button>

        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            minHeight: '44px',
          }}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  )
}
