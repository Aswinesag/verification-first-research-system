// Investigation Type Definitions

export interface Investigation {
  id: string
  query: string
  timestamp: number
  status: 'completed' | 'failed' | 'in_progress'
  confidence: number
  claimsCount: number
  response: any
}

export interface InvestigationHistory {
  investigations: Investigation[]
  lastUpdated: number
}

export interface ExecutionStep {
  step: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  timestamp: number
  details?: string
}

export interface AgentActivity {
  agent: 'Planner' | 'Retriever' | 'Executor' | 'Verifier' | 'Graph Engine' | 'Confidence Engine'
  message: string
  timestamp: number
  status: 'success' | 'warning' | 'error'
}

export interface MemoryEntry {
  id: string
  content: string
  source: string
  confidence: number
  claimId: string
  investigationId: string
  investigationQuery: string
  timestamp: number
  relationships: string[]
}
