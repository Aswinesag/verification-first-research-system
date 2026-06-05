// Graph Type Definitions

export interface GraphNode {
  id: string
  text: string
  trust_level: 'high' | 'medium' | 'low'
  confidence: number
  verification_status?: 'verified' | 'unsupported' | 'contradicted'
}

export interface GraphEdge {
  source: string
  target: string
  type: 'supports' | 'contradicts' | 'related'
  weight?: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphConfig {
  nodeColor: string
  edgeColor: string
  nodeSize: number
  linkDistance: number
  repulsion: number
}

export interface GraphFilters {
  showVerified: boolean
  showPartial: boolean
  showWeak: boolean
  showContradictory: boolean
}
