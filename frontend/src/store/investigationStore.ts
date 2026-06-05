import { create } from 'zustand'
import type { VARAResponse } from '../types/api'
import type { ExecutionStep, AgentActivity } from '../types/investigation'

interface InvestigationState {
  // Current investigation
  query: string
  loading: boolean
  error: string | null
  response: VARAResponse | null
  selectedClaim: string | null
  executionSteps: ExecutionStep[]
  agentActivities: AgentActivity[]
  
  // Actions
  setQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setResponse: (response: VARAResponse | null) => void
  setSelectedClaim: (claimId: string | null) => void
  setExecutionSteps: (steps: ExecutionStep[] | ((prev: ExecutionStep[]) => ExecutionStep[])) => void
  addAgentActivity: (activity: AgentActivity) => void
  reset: () => void
}

export const useInvestigationStore = create<InvestigationState>()(
  (set) => ({
    // State
    query: '',
    loading: false,
    error: null,
    response: null,
    selectedClaim: null,
    executionSteps: [],
    agentActivities: [],
    
    // Actions
    setQuery: (query) => set({ query }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setResponse: (response) => set({ response }),
    setSelectedClaim: (claimId) => set({ selectedClaim: claimId }),
    setExecutionSteps: (stepsOrUpdater) =>
      set((state) => ({
        executionSteps:
          typeof stepsOrUpdater === 'function'
            ? stepsOrUpdater(state.executionSteps)
            : stepsOrUpdater,
      })),
    addAgentActivity: (activity) =>
      set((state) => ({
        agentActivities: [...state.agentActivities, activity],
      })),
    reset: () =>
      set({
        query: '',
        loading: false,
        error: null,
        response: null,
        selectedClaim: null,
        executionSteps: [],
        agentActivities: [],
      }),
  })
)
