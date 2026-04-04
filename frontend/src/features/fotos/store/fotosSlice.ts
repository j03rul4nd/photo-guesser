import { create } from 'zustand'

interface FotoItem {
  /** Key en R2 (obtenida tras el upload) */
  key: string
  /** URL local para previsualización (ObjectURL) */
  previewUrl: string
  /** Nombre original del archivo */
  nombre: string
}

type UploadEstado = 'idle' | 'uploading' | 'done' | 'error'

interface FotosState {
  fotos: FotoItem[]
  uploadEstado: UploadEstado
  uploadProgreso: number   // 0-100
  uploadError: string | null

  addFoto: (foto: FotoItem) => void
  removeFoto: (key: string) => void
  replaceFoto: (key: string, foto: FotoItem) => void
  setFotos: (fotos: FotoItem[]) => void
  setUploadEstado: (estado: UploadEstado) => void
  setUploadProgreso: (progreso: number) => void
  setUploadError: (error: string | null) => void
  reset: () => void
}

export const useFotosStore = create<FotosState>((set) => ({
  fotos: [],
  uploadEstado: 'idle',
  uploadProgreso: 0,
  uploadError: null,

  addFoto: (foto) => set((s) => ({ fotos: [...s.fotos, foto] })),
  removeFoto: (key) =>
    set((s) => {
      const f = s.fotos.find((x) => x.key === key)
      if (f) URL.revokeObjectURL(f.previewUrl)
      return { fotos: s.fotos.filter((x) => x.key !== key) }
    }),
  replaceFoto: (key, foto) =>
    set((s) => {
      const idx = s.fotos.findIndex((x) => x.key === key)
      if (idx === -1) return s
      const next = [...s.fotos]
      URL.revokeObjectURL(next[idx]!.previewUrl)
      next[idx] = foto
      return { fotos: next }
    }),
  setFotos: (fotos) => set({ fotos }),
  setUploadEstado: (uploadEstado) => set({ uploadEstado }),
  setUploadProgreso: (uploadProgreso) => set({ uploadProgreso }),
  setUploadError: (uploadError) => set({ uploadError }),
  reset: () => set({ fotos: [], uploadEstado: 'idle', uploadProgreso: 0, uploadError: null }),
}))
