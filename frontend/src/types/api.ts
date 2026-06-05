// API Type Definitions

export interface Source {
  source: string
  snippet: string
  url?: string
  score: number
  source_id: string
}

export interface Verification {
  verification_status: 'verified' | 'unsupported' | 'contradicted' | 'pending'
  evidence_quality_score: number
  reasoning_validity_score: number
  contradiction_flags: string[]
  explanation: string
}

export interface Claim {
  claim_id: string
  text: string
  confidence: number
  uncertainty: number
  trust_level: 'high' | 'medium' | 'low'
  verification: Verification | null
  sources: Source[]
  raw: any
}

export interface Subtask {
  task_id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

export interface GraphNode {
  id: string
  text: string
  trust_level: string
  confidence: number
}

export interface GraphEdge {
  source: string
  target: string
  type: 'supports' | 'contradicts' | 'related'
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface SystemConfidence {
  overall_confidence: number
  risk_level: string
}

export interface VARAResponse {
  goal: string
  subtasks: Subtask[]
  claims: Claim[]
  graph: Graph
  overall_confidence: number
  risk_level: string
  steps: any[]
  system_confidence: SystemConfidence | null
}

export interface HealthResponse {
  status: string
  llm: string
  vector_db: string
  web_search: string
  uptime_seconds: number
}

export interface MetricsData {
  request_count: number
  llm_calls: number
  retrieval_calls: number
  failure_count: number
  failure_rate: number
  component_metrics?: Record<string, {
    calls: number
    failures: number
    failure_rate: number
    avg_latency_ms: number
    p95_latency_ms: number
    p99_latency_ms: number
  }>
}

export interface MetricsResponse {
  metrics: MetricsData
}
