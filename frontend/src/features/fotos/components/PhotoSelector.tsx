import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingReveal } from '@/components/shared/LoadingReveal'
import { RandomPickBtn } from './RandomPickBtn'
import { PhotoGrid } from './PhotoGrid'
import { PhotoProgressBar } from './PhotoProgressBar'
import { usePhotoRandom } from '../hooks/usePhotoRandom'
import { usePhotoUpload } from '../hooks/usePhotoUpload'
import { useFotosStore } from '../store/fotosSlice'
import type { ClientWSEvent } from '@shared/schemas'

const MIN_FOTOS = 10
const MAX_FOTOS = 20

interface FotoLocal {
  file: File
  key: string          // temporal hasta upload; se reemplaza con key de R2
  previewUrl: string
  nombre: string
  uploaded: boolean
}

interface PhotoSelectorProps {
  salaCode: string
  jugadorId: string
  onConfirm: (msg: ClientWSEvent) => void
  onClose: () => void
}

/**
 * PhotoSelector — pantalla de selección de fotos.
 * Modo B (random) como hero. Modo A (manual) como secundario.
 * Al confirmar: sube todas a R2 y emite FOTOS_READY via WS.
 */
export function PhotoSelector({ salaCode, jugadorId, onConfirm, onClose }: PhotoSelectorProps) {
  const [fotos, setFotos] = useState<FotoLocal[]>([])
  const [modo, setModo] = useState<'b' | 'a'>('b')
  const manualInputRef = useRef<HTMLInputElement>(null)
  const { pickRandom, getReplacementFor } = usePhotoRandom()
  const { uploadAll } = usePhotoUpload(salaCode, jugadorId)
  const { uploadEstado, uploadProgreso, uploadError } = useFotosStore()

  const makeLocal = (file: File): FotoLocal => ({
    file,
    key: `local-${file.name}-${Date.now()}`,
    previewUrl: URL.createObjectURL(file),
    nombre: file.name,
    uploaded: false,
  })

  // Modo B: selección aleatoria
  const handleRandomPick = (files: File[]) => {
    if (files.length < MIN_FOTOS) {
      alert(`Necesitas al menos ${MIN_FOTOS} fotos. Seleccionaste ${files.length}.`)
      return
    }
    setModo('b')
    const picked = pickRandom(files, MIN_FOTOS)
    setFotos(picked.map(makeLocal))
  }

  // Modo A: selección manual
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setModo('a')
    setFotos((prev) => {
      const nuevas = files.map(makeLocal)
      const combined = [...prev, ...nuevas].slice(0, MAX_FOTOS)
      return combined
    })
    e.target.value = ''
  }

  const handleRemove = (key: string) => {
    setFotos((prev) => {
      const f = prev.find((x) => x.key === key)
      if (f) URL.revokeObjectURL(f.previewUrl)
      return prev.filter((x) => x.key !== key)
    })
  }

  const handleReplace = (_key: string) => {
    const usedNames = fotos.map((f) => f.nombre)
    const replacement = getReplacementFor(usedNames)
    if (!replacement) {
      alert('No hay más fotos disponibles en el pool. Selecciona más fotos manualmente.')
      return
    }
    setFotos((prev) => [...prev, makeLocal(replacement)])
  }

  const handleConfirmar = async () => {
    if (fotos.length < MIN_FOTOS) return
    try {
      const results = await uploadAll(fotos.map((f) => f.file))
      const fotoKeys = results.map((r) => r.key)
      onConfirm({ type: 'FOTOS_READY', fotoKeys })
      onClose()
    } catch {
      // El error ya está en el store (uploadError)
    }
  }

  // Mostrar loading durante upload
  if (uploadEstado === 'uploading') {
    return (
      <LoadingReveal
        message={`revelando tus fotos... ${Math.round((uploadProgreso / 100) * fotos.length)} de ${fotos.length}`}
        progress={uploadProgreso}
        style={{ minHeight: '100dvh' }}
      />
    )
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.3rem',
            margin: 0,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Tus fotos
        </h1>
        <button
          onClick={onClose}
          aria-label="Cerrar selector de fotos"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            minHeight: '44px',
            padding: '0 8px',
          }}
        >
          Cancelar
        </button>
      </header>

      {/* Contenido scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          maxWidth: '560px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Progress bar */}
        <PhotoProgressBar actual={fotos.length} total={MIN_FOTOS} />

        {/* Modo B — hero */}
        <RandomPickBtn
          onPick={handleRandomPick}
          disabled={false}
        />

        {/* Separador */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-secondary)' }} />
          — o elige tú mismo ↓ —
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-secondary)' }} />
        </div>

        {/* Modo A — secundario */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            ref={manualInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleManualChange}
          />
          <Button
            variant="secondary"
            style={{ flex: 1, border: '2px solid var(--text-primary)', boxShadow: 'var(--shadow-sm)', fontWeight: 700 }}
            onClick={() => manualInputRef.current?.click()}
            disabled={fotos.length >= MAX_FOTOS}
          >
            + Añadir fotos
          </Button>
        </div>

        {/* Grid de miniaturas */}
        {fotos.length > 0 && (
          <PhotoGrid
            fotos={fotos}
            onRemove={handleRemove}
            onReplace={modo === 'b' ? handleReplace : undefined}
            showReplace={modo === 'b'}
            targetCount={MIN_FOTOS}
          />
        )}

        {/* Error de upload */}
        {uploadError && (
          <p
            style={{
              color: 'var(--incorrect)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              textAlign: 'center',
              margin: 0,
            }}
          >
            {uploadError}
          </p>
        )}
      </div>

      {/* Footer con botón confirmar */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--bg-secondary)',
        }}
      >
        <Button
          size="lg"
          style={{ width: '100%', boxShadow: 'var(--shadow-lg)', fontFamily: 'var(--font-display)' }}
          disabled={fotos.length < MIN_FOTOS}
          onClick={() => void handleConfirmar()}
        >
          {fotos.length >= MIN_FOTOS
            ? `✅ Confirmar ${fotos.length} fotos`
            : `Faltan ${MIN_FOTOS - fotos.length} fotos`}
        </Button>
      </div>
    </div>
  )
}
