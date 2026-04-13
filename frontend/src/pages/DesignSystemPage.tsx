/**
 * DesignSystemPage — página temporal de verificación del Sprint 1.2.
 * Muestra todos los tokens: colores, tipografías, sombras, componentes.
 * ELIMINAR antes de la Fase 2.
 */
import { useState } from 'react'
import { CheckCircleIcon, CubeIcon, HourglassIcon, MoonIcon, SunIcon, XCircleIcon } from '@phosphor-icons/react'
import { PolaroidFrame } from '@/components/shared/PolaroidFrame'
import { LoadingReveal } from '@/components/shared/LoadingReveal'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ─── helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '48px' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '1.1rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: '16px',
        borderBottom: '1px solid var(--bg-secondary)',
        paddingBottom: '8px',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: `var(${cssVar})`,
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid rgba(0,0,0,0.06)',
      }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
        {name}
      </span>
    </div>
  )
}

// ─── component ───────────────────────────────────────────────────────────────

export function DesignSystemPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [progress, setProgress] = useState(60)

  const toggleDark = () => {
    setDarkMode(d => !d)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: 'var(--bg-primary)',
      padding: '32px 24px',
      maxWidth: '640px',
      margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '2rem',
            margin: 0,
            color: 'var(--text-primary)',
          }}>
            PHOTO <span style={{ color: 'var(--accent)' }}>GUESSER</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Design System — Sprint 1.2 verification
          </p>
        </div>
        <button
          onClick={toggleDark}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--text-muted)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          {darkMode ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <SunIcon size={14} weight="duotone" aria-hidden="true" />
              Light
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <MoonIcon size={14} weight="duotone" aria-hidden="true" />
              Dark
            </span>
          )}
        </button>
      </div>

      {/* Colores base */}
      <Section title="Paleta base">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {[
            ['bg-primary', '--bg-primary'],
            ['bg-secondary', '--bg-secondary'],
            ['bg-surface', '--bg-surface'],
            ['text-primary', '--text-primary'],
            ['text-secondary', '--text-secondary'],
            ['text-muted', '--text-muted'],
            ['accent', '--accent'],
          ].map(([name, v]) => (
            <ColorSwatch key={name} name={name} cssVar={v} />
          ))}
        </div>
      </Section>

      {/* Colores de estado */}
      <Section title="Estados de juego">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {[
            ['correct', '--correct'],
            ['correct-bg', '--correct-bg'],
            ['incorrect', '--incorrect'],
            ['incorrect-bg', '--incorrect-bg'],
            ['pending', '--pending'],
            ['neutral', '--neutral-game'],
            ['timer-urgent', '--timer-urgent'],
          ].map(([name, v]) => (
            <ColorSwatch key={name} name={name} cssVar={v} />
          ))}
        </div>
      </Section>

      {/* Tipografía */}
      <Section title="Tipografía">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', margin: 0, color: 'var(--text-primary)' }}>
            Syne 800 — Display
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', margin: 0, color: 'var(--text-primary)' }}>
            Syne 700 — Subtítulos
          </p>
          <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
            Geist 500 — UI principal
          </p>
          <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 400, fontSize: '0.875rem', margin: 0, color: 'var(--text-secondary)' }}>
            Geist 400 — Texto de soporte
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '1rem', margin: 0, color: 'var(--text-secondary)' }}>
            Instrument Serif italic — Taglines y descripciones
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.15em', margin: 0, color: 'var(--text-primary)' }}>
            ABCD123
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)' }}>
            Geist Mono — Código de sala, datos técnicos
          </p>
        </div>
      </Section>

      {/* Sombras */}
      <Section title="Sombras">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {(['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-photo'] as const).map(s => (
            <div key={s} style={{
              width: '80px', height: '80px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: `var(--${s})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>{s}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* PolaroidFrame */}
      <Section title="Polaroid Frame">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <PolaroidFrame caption="polaroid sin caption" style={{ width: '140px' }}>
            <div style={{
              width: '100%',
              aspectRatio: '1',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '2rem' }}>IMG</span>
            </div>
          </PolaroidFrame>

          <PolaroidFrame caption="vacaciones 2024" style={{ width: '140px' }}>
            <div style={{
              width: '100%',
              aspectRatio: '1',
              background: 'linear-gradient(135deg, var(--bg-secondary), var(--accent-glow))',
            }} />
          </PolaroidFrame>

          {/* QR simulado */}
          <PolaroidFrame caption="ABCD123" style={{ width: '140px' }}>
            <div style={{
              width: '100%',
              aspectRatio: '1',
              backgroundColor: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '2rem' }}>◻️</span>
            </div>
          </PolaroidFrame>
        </div>
      </Section>

      {/* Botones */}
      <Section title="Botones (shadcn overrideado)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button>Crear partida</Button>
            <Button variant="secondary">Unirse</Button>
            <Button variant="outline">Compartir</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="destructive">Salir</Button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button size="sm">Pequeño</Button>
            <Button size="lg">Iniciar partida</Button>
            <Button disabled>Deshabilitado</Button>
          </div>
          <Button style={{ width: '100%' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <CubeIcon size={18} weight="duotone" aria-hidden="true" />
              Elegir 10 fotos al azar
            </span>
          </Button>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card>
            <CardHeader>
              <CardTitle>Ana García</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-ui)' }}>
                10 fotos listas · 450 pts
              </p>
            </CardContent>
          </Card>

          {/* Card de jugador en lobby */}
          {(['Fotos listas', 'Eligiendo...', 'Desconectado'] as const).map((estado, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: `3px solid ${i === 0 ? 'var(--accent)' : i === 2 ? 'var(--incorrect)' : 'var(--text-muted)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--font-ui)',
            }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {['Ana', 'Carlos', 'María'][i]}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{estado}</span>
              <span style={{ display: 'inline-flex' }}>
                {i === 0 && <CheckCircleIcon size={16} weight="fill" aria-hidden="true" />}
                {i === 1 && <HourglassIcon size={16} weight="duotone" aria-hidden="true" />}
                {i === 2 && <XCircleIcon size={16} weight="fill" aria-hidden="true" />}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge>Ronda 3</Badge>
          <Badge variant="secondary">Host</Badge>
          <Badge variant="correct">+100</Badge>
          <Badge variant="incorrect">Incorrecto</Badge>
          <Badge variant="pending">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <HourglassIcon size={14} weight="duotone" aria-hidden="true" />
              Timer
            </span>
          </Badge>
        </div>
      </Section>

      {/* Progress */}
      <Section title="Progress">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {progress}% fotos subidas
            </p>
            <Progress value={progress} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <Button size="sm" variant="ghost" onClick={() => setProgress(p => Math.max(0, p - 10))}>−10</Button>
              <Button size="sm" variant="ghost" onClick={() => setProgress(p => Math.min(100, p + 10))}>+10</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* LoadingReveal */}
      <Section title="Loading Reveal">
        <div style={{
          border: '1px dashed var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}>
          <LoadingReveal message="revelando tus fotos... 3 de 10" progress={30} />
        </div>
      </Section>

      {/* Opciones de respuesta */}
      <Section title="Opciones de respuesta">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {/* Normal */}
          <button style={{
            minHeight: '54px',
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--bg-surface)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'transform var(--transition-tactile)',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Ana García
          </button>

          {/* Seleccionada */}
          <button style={{
            minHeight: '54px',
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(255,77,46,0.08)',
            border: '2px solid var(--accent)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            Carlos Pérez
          </button>

          {/* Correcta */}
          <button style={{
            minHeight: '54px',
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--correct-bg)',
            border: '2px solid var(--correct)',
            color: 'var(--correct)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            María López
          </button>

          {/* Incorrecta */}
          <button style={{
            minHeight: '54px',
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--incorrect-bg)',
            border: '2px solid var(--incorrect)',
            color: 'var(--incorrect)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            opacity: 0.5,
            cursor: 'pointer',
          }}>
            Juan Torres
          </button>
        </div>
      </Section>

      {/* Footer */}
      <div style={{
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: '1px solid var(--bg-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Design System v2.0 — Sprint 1.2 — Eliminar antes de Fase 2
      </div>
    </div>
  )
}
