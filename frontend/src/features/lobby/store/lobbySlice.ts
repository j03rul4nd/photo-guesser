import { create } from 'zustand'
import type { Jugador } from '@shared/schemas'

interface LobbyState {
  jugadores: Jugador[]
  hostId: string | null
  salaCode: string
  jugadorId: string
  nickname: string
  setJugadores: (jugadores: Jugador[]) => void
  setHostId: (id: string) => void
  setSala: (salaCode: string, jugadorId: string, nickname: string) => void
  reset: () => void
}

export const useLobbyStore = create<LobbyState>((set) => ({
  jugadores: [],
  hostId: null,
  salaCode: '',
  jugadorId: '',
  nickname: '',
  setJugadores: (jugadores) => set({ jugadores }),
  setHostId: (hostId) => set({ hostId }),
  setSala: (salaCode, jugadorId, nickname) => set({ salaCode, jugadorId, nickname }),
  reset: () => set({ jugadores: [], hostId: null }),
}))
