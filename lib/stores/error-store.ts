import { create } from 'zustand'

interface ErrorState {
  lastError: string | null
  setError: (error: string | null) => void
  clearError: () => void
}

export const useErrorStore = create<ErrorState>((set) => ({
  lastError: null,
  setError: (error) => set({ lastError: error }),
  clearError: () => set({ lastError: null }),
}))
