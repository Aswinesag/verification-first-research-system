import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Investigation } from '../types/investigation'

interface HistoryState {
  investigations: Investigation[]
  
  // Actions
  addInvestigation: (investigation: Investigation) => void
  updateInvestigation: (id: string, updates: Partial<Investigation>) => void
  deleteInvestigation: (id: string) => void
  getInvestigation: (id: string) => Investigation | undefined
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      investigations: [],
      
      addInvestigation: (investigation) =>
        set((state) => ({
          investigations: [investigation, ...state.investigations],
        })),
      
      updateInvestigation: (id, updates) =>
        set((state) => ({
          investigations: state.investigations.map((inv) =>
            inv.id === id ? { ...inv, ...updates } : inv
          ),
        })),
      
      deleteInvestigation: (id) =>
        set((state) => ({
          investigations: state.investigations.filter((inv) => inv.id !== id),
        })),
      
      getInvestigation: (id) => {
        return get().investigations.find((inv) => inv.id === id)
      },
      
      clearHistory: () => set({ investigations: [] }),
    }),
    {
      name: 'vara-history',
    }
  )
)
