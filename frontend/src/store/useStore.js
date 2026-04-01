import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // State
  query: '',
  loading: false,
  error: null,
  response: null,
  selectedClaim: null,
  executionSteps: [],
  graphData: null,
  
  // Actions
  setQuery: (query) => set({ query }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setResponse: (response) => set({ response }),
  setSelectedClaim: (claim) => set({ selectedClaim: claim }),
  setExecutionSteps: (stepsOrUpdater) =>
    set((state) => {
      const nextSteps =
        typeof stepsOrUpdater === 'function'
          ? stepsOrUpdater(state.executionSteps)
          : stepsOrUpdater

      return { executionSteps: Array.isArray(nextSteps) ? nextSteps : [] }
    }),
  setGraphData: (graphData) => set({ graphData }),
  
  // Reset
  reset: () => set({
    query: '',
    loading: false,
    error: null,
    response: null,
    selectedClaim: null,
    executionSteps: [],
    graphData: null,
  }),
  
  // Computed
  hasData: () => !!get().response,
  getClaims: () => get().response?.claims || [],
  getGraphNodes: () => get().response?.graph?.nodes || [],
  getGraphEdges: () => get().response?.graph?.edges || [],
  getOverallConfidence: () => get().response?.overall_confidence || 0,
  getRiskLevel: () => get().response?.risk_level || 'unknown',
}))
