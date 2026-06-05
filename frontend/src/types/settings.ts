// Settings Type Definitions

export interface GeneralSettings {
  workspaceName: string
  language: string
}

export interface AppearanceSettings {
  theme: 'dark' | 'light'
  accentColor: string
}

export interface ReasoningSettings {
  debateMode: boolean
  confidenceThreshold: number
}

export interface RetrievalSettings {
  webSearchEnabled: boolean
  datasetSearchEnabled: boolean
  localMemoryEnabled: boolean
}

export interface VerificationSettings {
  verificationStrictness: 'strict' | 'moderate' | 'lenient'
  autoVerify: boolean
}

export interface AdvancedSettings {
  cacheEnabled: boolean
  debugMode: boolean
  maxRetries: number
}

export interface Settings {
  general: GeneralSettings
  appearance: AppearanceSettings
  reasoning: ReasoningSettings
  retrieval: RetrievalSettings
  verification: VerificationSettings
  advanced: AdvancedSettings
}
