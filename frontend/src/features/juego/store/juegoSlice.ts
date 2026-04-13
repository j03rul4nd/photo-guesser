import { create } from 'zustand'
import type { RankingItem } from '@shared/schemas'

type FaseRonda = 'idle' | 'showing' | 'answered' | 'result'

interface Opcion {
  id: string
  nickname: string
}

interface FotoActual {
  url: string
  opciones: Opcion[]
  rondaNum: number
  totalRondas: number
  timerMs: number  // duración real recibida del servidor (puede ser < 15000 al reconectar)
}

interface JuegoState {
  faseRonda: FaseRonda
  fotoActual: FotoActual | null
  respuestaSeleccionada: string | null  // ID del jugador seleccionado
  rankingActual: RankingItem[]
  miPuntuacion: number
  esMiFoto: boolean
  respuestaCount: { count: number; total: number }
  propietarioNickname: string | null
  respuestasCorrectas: string[]
  puntosGanados: Record<string, number>
  gameOver: boolean
  rankingFinal: Array<{ id: string; nickname: string; puntosTotal: number; fotosAdivinadas: number }>
  totalRondasPartida: number  // total recibido en GAME_START

  setFotoActual: (foto: FotoActual, esMiFoto: boolean) => void
  setRespuesta: (jugadorId: string) => void
  setFaseRonda: (fase: FaseRonda) => void
  setRespuestaCount: (count: number, total: number) => void
  setRoundResult: (data: {
    propietarioNickname: string
    respuestasCorrectas: string[]
    puntosGanados: Record<string, number>
    rankingRonda: RankingItem[]
    miId: string
  }) => void
  setGameOver: (rankingFinal: JuegoState['rankingFinal']) => void
  setTotalRondasPartida: (total: number) => void
  reset: () => void
}

const initialState = {
  faseRonda: 'idle' as FaseRonda,
  fotoActual: null,
  respuestaSeleccionada: null,
  rankingActual: [],
  miPuntuacion: 0,
  esMiFoto: false,
  respuestaCount: { count: 0, total: 0 },
  propietarioNickname: null,
  respuestasCorrectas: [],
  puntosGanados: {},
  gameOver: false,
  rankingFinal: [],
  totalRondasPartida: 0,
}

export const useJuegoStore = create<JuegoState>((set) => ({
  ...initialState,

  setFotoActual: (fotoActual, esMiFoto) =>
    set({
      fotoActual,
      esMiFoto,
      faseRonda: 'showing',
      respuestaSeleccionada: null,
      respuestaCount: { count: 0, total: 0 },
      propietarioNickname: null,
      respuestasCorrectas: [],
      puntosGanados: {},
    }),

  setRespuesta: (respuesta) =>
    set({ respuestaSeleccionada: respuesta, faseRonda: 'answered' }),

  setFaseRonda: (faseRonda) => set({ faseRonda }),

  setRespuestaCount: (count, total) =>
    set({ respuestaCount: { count, total } }),

  setRoundResult: ({ propietarioNickname, respuestasCorrectas, puntosGanados, rankingRonda, miId }) =>
    set((s) => ({
      faseRonda: 'result',
      propietarioNickname,
      respuestasCorrectas,
      puntosGanados,
      rankingActual: rankingRonda,
      miPuntuacion: rankingRonda.find((r) => r.id === miId)?.puntosTotal ?? s.miPuntuacion,
    })),

  setGameOver: (rankingFinal) => set({ gameOver: true, faseRonda: 'idle', rankingFinal }),

  setTotalRondasPartida: (totalRondasPartida) => set({ totalRondasPartida }),

  reset: () => set(initialState),
}))
