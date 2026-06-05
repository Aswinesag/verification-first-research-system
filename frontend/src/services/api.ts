import axios from 'axios'
import type {
  Source,
  Claim,
  Subtask,
  GraphNode,
  GraphEdge,
  Graph,
  VARAResponse,
  HealthResponse,
  MetricsResponse,
} from '../types/api'

const env = (import.meta as any).env

// In dev, default to Vite proxy (/api → :8000) to avoid CORS and inherit proxy timeouts.
const API_BASE_URL =
  env.VITE_API_URL || (env.DEV ? '/api' : 'http://localhost:8000')

// Investigations can exceed 3+ minutes (LLM + retrieval + verification).
const QUERY_TIMEOUT_MS = Number(env.VITE_API_TIMEOUT) || 600_000 // 10 minutes
const DEFAULT_TIMEOUT_MS = 30_000

const clamp01 = (value: number, fallback: number = 0): number => {
  const n = Number(value)
  if (Number.isNaN(n)) return fallback
  return Math.max(0, Math.min(1, n))
}

const getTrustLevel = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence >= 0.75) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

const normalizeGoal = (goal: any): string => {
  if (typeof goal === 'string') return goal
  if (goal && typeof goal === 'object') {
    return goal.user_query || goal.parsed_objective || 'Research analysis'
  }
  return 'Research analysis'
}

const normalizeSubtasks = (data: any): Subtask[] => {
  const subtasks = Array.isArray(data?.subtasks)
    ? data.subtasks
    : Array.isArray(data?.goal?.subtasks)
      ? data.goal.subtasks
      : []

  return subtasks.map((task: any, index: number) => {
    if (typeof task === 'string') return { task_id: `task-${index}`, description: task, status: 'pending' }
    return {
      task_id: task?.task_id || `task-${index}`,
      description: task?.description || task?.text || 'Subtask',
      status: task?.status || 'pending',
    }
  })
}

const normalizeVerificationMap = (verifications: any): Record<string, any> => {
  if (!verifications) return {}
  if (Array.isArray(verifications)) {
    return verifications.reduce((acc: Record<string, any>, item: any) => {
      if (item?.claim_id) acc[item.claim_id] = item
      return acc
    }, {})
  }
  if (typeof verifications === 'object') return verifications
  return {}
}

const normalizeSources = (claim: any): Source[] => {
  const rawSources = Array.isArray(claim?.sources)
    ? claim.sources
    : Array.isArray(claim?.evidence_sources)
      ? claim.evidence_sources
      : []

  return rawSources.map((src: any, index: number) => ({
    source: src?.source || 'retrieved_doc',
    snippet: src?.snippet || src?.text || '',
    url: src?.url,
    score: clamp01(src?.score, 0.5),
    source_id: src?.source_id || `source-${index}`,
  }))
}

const normalizeClaims = (data: any): Claim[] => {
  const claims = Array.isArray(data?.claims) ? data.claims : []
  const verificationMap = normalizeVerificationMap(data?.verifications)

  return claims.map((rawClaim: any, index: number) => {
    const claimId = rawClaim?.claim_id || rawClaim?.id || `claim-${index}`
    const verification = verificationMap[claimId] || rawClaim?.verification || null
    const baseConfidence = clamp01(
      rawClaim?.confidence ?? rawClaim?.final_confidence,
      0.5
    )
    const confidence = verification
      ? clamp01(
          (Number(verification.evidence_quality_score || 0) + Number(verification.reasoning_validity_score || 0)) / 2,
          baseConfidence
        )
      : baseConfidence
    const uncertainty = clamp01(rawClaim?.uncertainty, 1 - confidence)

    return {
      claim_id: claimId,
      text: rawClaim?.text || rawClaim?.claim_text || 'Claim',
      confidence,
      uncertainty,
      trust_level: rawClaim?.trust_level || getTrustLevel(confidence),
      verification: verification
        ? {
            verification_status: verification.verification_status || 'unsupported',
            evidence_quality_score: clamp01(verification.evidence_quality_score, 0),
            reasoning_validity_score: clamp01(verification.reasoning_validity_score, 0),
            contradiction_flags: verification.contradiction_flags || [],
            explanation: verification.explanation || verification.verifier_notes || '',
          }
        : null,
      sources: normalizeSources(rawClaim),
      raw: rawClaim,
    }
  })
}

const buildGraph = (claims: Claim[], existingGraph: any): Graph => {
  if (existingGraph && Array.isArray(existingGraph.nodes) && Array.isArray(existingGraph.edges)) {
    return existingGraph
  }

  const nodes: GraphNode[] = claims.map((claim) => ({
    id: claim.claim_id,
    text: claim.text,
    trust_level: claim.trust_level,
    confidence: claim.confidence,
  }))

  const edges: GraphEdge[] = []
  const edgeKeys = new Set<string>()

  const addEdge = (source: string, target: string, type: GraphEdge['type']) => {
    const key = `${source}-${target}-${type}`
    if (edgeKeys.has(key) || source === target) return
    edgeKeys.add(key)
    edges.push({ source, target, type })
  }

  for (let i = 1; i < nodes.length; i += 1) {
    addEdge(nodes[i - 1].id, nodes[i].id, 'supports')
  }

  claims.forEach((claim) => {
    const flags = claim.verification?.contradiction_flags || []
    const status = claim.verification?.verification_status
    if (status === 'contradicted' || flags.includes('conflict_detected')) {
      const others = claims.filter((c) => c.claim_id !== claim.claim_id)
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)]
        addEdge(claim.claim_id, target.claim_id, 'contradicts')
      }
    }
    const related = claims.filter(
      (c) =>
        c.claim_id !== claim.claim_id &&
        c.sources.some((s) => claim.sources.some((cs) => cs.source === s.source))
    )
    related.slice(0, 2).forEach((c) => addEdge(claim.claim_id, c.claim_id, 'related'))
  })

  return { nodes, edges }
}

const normalizeCoreResponse = (data: any): VARAResponse => {
  if (!data || typeof data !== 'object') return data

  const claims = normalizeClaims(data)
  const graph = buildGraph(claims, data.graph)
  const overallConfidence = typeof data?.overall_confidence === 'number'
    ? clamp01(data.overall_confidence, 0)
    : typeof data?.system_confidence?.overall_confidence === 'number'
      ? clamp01(data.system_confidence.overall_confidence, 0)
      : claims.length
        ? claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length
        : 0
  const riskLevel = data?.risk_level || data?.system_confidence?.risk_level || getTrustLevel(1 - overallConfidence)

  return {
    goal: normalizeGoal(data.goal),
    subtasks: normalizeSubtasks(data),
    claims,
    graph,
    overall_confidence: overallConfidence,
    risk_level: riskLevel,
    steps: Array.isArray(data.steps) ? data.steps : [],
    system_confidence: data.system_confidence || null,
  }
}

const defaultHeaders = { 'Content-Type': 'application/json' }

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: defaultHeaders,
})

const queryApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: QUERY_TIMEOUT_MS,
  headers: defaultHeaders,
})

const attachInterceptors = (client: typeof api, label: string) => {
  client.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request [${label}]: ${config.method?.toUpperCase()} ${config.url}`)
      return config
    },
    (error) => Promise.reject(error)
  )

  client.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response [${label}]: ${response.status} ${response.config.url}`)
      return response
    },
    (error) => {
      console.error(`❌ API Response Error [${label}]:`, error)

      if (error.code === 'ECONNABORTED') {
        const minutes = Math.round((error.config?.timeout || QUERY_TIMEOUT_MS) / 60_000)
        throw new Error(
          `Investigation timed out after ${minutes} minutes. The backend may still be processing — try a simpler query or increase VITE_API_TIMEOUT.`
        )
      }

      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.')
      }

      if (error.response?.status === 408) {
        throw new Error('The server stopped processing due to a timeout. Try a simpler query.')
      }

      if (error.code === 'ERR_NETWORK') {
        throw new Error(
          'Cannot reach the VARA backend. Ensure it is running on port 8000 and restart the frontend dev server.'
        )
      }

      throw new Error(error.message || 'An error occurred while processing your request.')
    }
  )
}

attachInterceptors(api, 'default')
attachInterceptors(queryApi, 'query')

export const apiService = {
  async runQuery(query: string): Promise<VARAResponse> {
    try {
      const response = await queryApi.post('/query', { query })
      const payload = response.data
      const data = payload?.data ?? payload
      return normalizeCoreResponse(data)
    } catch (error) {
      throw error
    }
  },
  
  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async getMetrics(): Promise<MetricsResponse | null> {
    try {
      const response = await api.get('/metrics')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) return null
      throw error
    }
  },
}

export default apiService
