import { useRef } from 'react'

/**
 * usePhotoRandom — selección aleatoria de fotos con pool para reemplazos.
 * Fisher-Yates in-place sobre una copia del array original.
 */
export function usePhotoRandom() {
  // Pool original guardado para poder hacer reemplazos después
  const poolRef = useRef<File[]>([])

  /**
   * Baraja un array in-place usando Fisher-Yates.
   * Trabaja sobre una copia, no muta el original.
   */
  const shuffle = (files: File[]): File[] => {
    const arr = [...files]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
    }
    return arr
  }

  /**
   * Elige `count` fotos al azar del array dado.
   * Guarda el array completo como pool para reemplazos posteriores.
   */
  const pickRandom = (files: File[], count: number): File[] => {
    poolRef.current = [...files]
    return shuffle(files).slice(0, count)
  }

  /**
   * Devuelve una foto del pool que NO esté ya seleccionada.
   * Si no queda ninguna libre, devuelve null.
   */
  const getReplacementFor = (currentKeys: string[]): File | null => {
    const usedNames = new Set(currentKeys)
    const available = poolRef.current.filter((f) => !usedNames.has(f.name))
    if (available.length === 0) return null
    const idx = Math.floor(Math.random() * available.length)
    return available[idx] ?? null
  }

  return {
    pickRandom,
    getReplacementFor,
    pool: poolRef.current,
  }
}
