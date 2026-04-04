import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useFotosStore } from '../store/fotosSlice'
import { toast } from '@/components/ui/toast'

const MAX_RETRIES = 2

interface UploadResult {
  key: string
  previewUrl: string
  nombre: string
}

export function usePhotoUpload(salaCode: string, jugadorId: string) {
  const { setUploadEstado, setUploadProgreso, setUploadError, setFotos } = useFotosStore()

  const uploadAll = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      setUploadEstado('uploading')
      setUploadProgreso(0)
      setUploadError(null)

      const results: UploadResult[] = []
      const total = files.length

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!
        let success = false

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const { uploadUrl, key } = await api.obtenerUrlFoto(
              salaCode,
              jugadorId,
              file.type || 'image/jpeg',
              file.size,
            )
            await api.subirFotoAR2(uploadUrl, file)
            const previewUrl = URL.createObjectURL(file)
            results.push({ key, previewUrl, nombre: file.name })
            success = true
            break
          } catch (err) {
            if (attempt === MAX_RETRIES) {
              
              const errorMsg = `No pudimos subir "${file.name}". Inténtalo de nuevo.`
              setUploadEstado('error')
              setUploadError(errorMsg)
              // Sprint 5.1 — toast de error transitorio
              toast.error(errorMsg, {
                label: 'Reintentar',
                onClick: () => { void uploadAll(files) },
              })
              throw err
            }
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
          }
        }

        if (!success) break
        setUploadProgreso(Math.round(((i + 1) / total) * 100))
      }

      if (results.length === files.length) {
        setUploadEstado('done')
        setFotos(results)
      }

      return results
    },
    [salaCode, jugadorId, setUploadEstado, setUploadProgreso, setUploadError, setFotos],
  )

  return { uploadAll }
}
