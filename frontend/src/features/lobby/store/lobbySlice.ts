import { create } from 'zustand'

interface LobbyState {
  salaCode: string
  jugadorId: string
  nickname: string
  setSala: (salaCode: string, jugadorId: string, nickname: string) => void
  reset: () => void
}

export const useLobbyStore = create<LobbyState>((set) => ({
  salaCode: '',
  jugadorId: '',
  nickname: '',
  setSala: (salaCode, jugadorId, nickname) => set({ salaCode, jugadorId, nickname }),
  reset: () => set({ salaCode: '', jugadorId: '', nickname: '' }),
}))
