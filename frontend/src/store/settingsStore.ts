import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types/settings'

interface SettingsState {
  settings: Settings
  
  // Actions
  updateSettings: (section: keyof Settings, updates: Partial<Settings[keyof Settings]>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  general: {
    workspaceName: 'My Workspace',
    language: 'en',
  },
  appearance: {
    theme: 'dark',
    accentColor: '#3B82F6',
  },
  reasoning: {
    debateMode: false,
    confidenceThreshold: 0.5,
  },
  retrieval: {
    webSearchEnabled: true,
    datasetSearchEnabled: true,
    localMemoryEnabled: true,
  },
  verification: {
    verificationStrictness: 'moderate',
    autoVerify: true,
  },
  advanced: {
    cacheEnabled: true,
    debugMode: false,
    maxRetries: 3,
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      
      updateSettings: (section, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: {
              ...state.settings[section],
              ...updates,
            },
          },
        })),
      
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'vara-settings',
    }
  )
)
