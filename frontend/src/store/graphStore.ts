import { create } from 'zustand'
import type { GraphData, GraphFilters, GraphConfig } from '../types/graph'

interface GraphState {
  graphData: GraphData | null
  filters: GraphFilters
  config: GraphConfig
  selectedNode: string | null
  hoveredNode: string | null
  
  // Actions
  setGraphData: (data: GraphData) => void
  setFilters: (filters: Partial<GraphFilters>) => void
  setConfig: (config: Partial<GraphConfig>) => void
  setSelectedNode: (nodeId: string | null) => void
  setHoveredNode: (nodeId: string | null) => void
  reset: () => void
}

const defaultFilters: GraphFilters = {
  showVerified: true,
  showPartial: true,
  showWeak: true,
  showContradictory: true,
}

const defaultConfig: GraphConfig = {
  nodeColor: '#3B82F6',
  edgeColor: 'rgba(255,255,255,0.2)',
  nodeSize: 8,
  linkDistance: 100,
  repulsion: 200,
}

export const useGraphStore = create<GraphState>((set) => ({
  graphData: null,
  filters: defaultFilters,
  config: defaultConfig,
  selectedNode: null,
  hoveredNode: null,
  
  setGraphData: (data) => set({ graphData: data }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),
  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
  setHoveredNode: (nodeId) => set({ hoveredNode: nodeId }),
  reset: () =>
    set({
      graphData: null,
      filters: defaultFilters,
      config: defaultConfig,
      selectedNode: null,
      hoveredNode: null,
    }),
}))
