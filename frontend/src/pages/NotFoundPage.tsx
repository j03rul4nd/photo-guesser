import { useNavigate } from 'react-router-dom'
import { PolaroidFrame } from '@/components/shared/PolaroidFrame'
import { Button } from '@/components/ui/button'

/**
 * NotFoundPage — sala no encontrada o ruta inválida.
 * Polaroid en blanco con mensaje de error en tono del producto.
 */
export function NotFoundPage({ message }: { message?: string }) {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: '32px' }}>
      {/* Polaroid en blanco */}
      <PolaroidFrame style={{ width: '180px' }}>
        <div style={{ width: '100%', aspectRatio: '1', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '3rem', opacity: 0.3 }}>📷</span>
        </div>
      </PolaroidFrame>

      <div style={{ textAlign: 'center', maxWidth: '300px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {message ?? 'Esta sala ya cerró'}
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
          o el código no es correcto. Puede que la partida terminó o que el link haya expirado.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button style={{ width: '100%' }} onClick={() => navigate('/')}>
            Crear sala nueva
          </Button>
          <Button variant="secondary" style={{ width: '100%' }} onClick={() => navigate('/unirse')}>
            Probar otro código
          </Button>
        </div>
      </div>
    </div>
  )
}
