import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const clamp01 = (value, fallback = 0) => {
  const n = Number(value)
  if (Number.isNaN(n)) return fallback
  return Math.max(0, Math.min(1, n))
}

const getTrustLevel = (confidence) => {
  if (confidence >= 0.75) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

const normalizeGoal = (goal) => {
  if (typeof goal === 'string') return goal
  if (goal && typeof goal === 'object') {
    return goal.user_query || goal.parsed_objective || 'Research analysis'
  }
  return 'Research analysis'
}

const normalizeSubtasks = (data) => {
  const subtasks = Array.isArray(data?.subtasks)
    ? data.subtasks
    : Array.isArray(data?.goal?.subtasks)
      ? data.goal.subtasks
      : []

  return subtasks.map((task, index) => {
    if (typeof task === 'string') return { description: task }
    return {
      task_id: task?.task_id || `task-${index}`,
      description: task?.description || task?.text || 'Subtask',
      status: task?.status || 'pending',
    }
  })
}

const normalizeVerificationMap = (verifications) => {
  if (!verifications) return {}
  if (Array.isArray(verifications)) {
    return verifications.reduce((acc, item) => {
      if (item?.claim_id) acc[item.claim_id] = item
      return acc
    }, {})
  }
  if (typeof verifications === 'object') return verifications
  return {}
}

const normalizeSources = (claim) => {
  const rawSources = Array.isArray(claim?.sources)
    ? claim.sources
    : Array.isArray(claim?.evidence_sources)
      ? claim.evidence_sources
      : []

  return rawSources.map((src, index) => ({
    source: src?.source || 'retrieved_doc',
    snippet: src?.snippet || src?.text || '',
    url: src?.url,
    score: clamp01(src?.score, 0.5),
    source_id: src?.source_id || `source-${index}`,
  }))
}

const normalizeClaims = (data) => {
  const claims = Array.isArray(data?.claims) ? data.claims : []
  const verificationMap = normalizeVerificationMap(data?.verifications)

  return claims.map((rawClaim, index) => {
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

const buildGraph = (claims, existingGraph) => {
  if (existingGraph && Array.isArray(existingGraph.nodes) && Array.isArray(existingGraph.edges)) {
    return existingGraph
  }

  const nodes = claims.map((claim) => ({
    id: claim.claim_id,
    text: claim.text,
    trust_level: claim.trust_level,
    confidence: claim.confidence,
  }))

  const edges = []
  for (let i = 1; i < nodes.length; i += 1) {
    edges.push({
      source: nodes[i - 1].id,
      target: nodes[i].id,
      type: 'supports',
    })
  }

  return { nodes, edges }
}

const normalizeCoreResponse = (data) => {
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

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error)
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The backend is still processing; try a simpler query or retry in a moment.')
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.')
    }
    
    if (error.response?.status === 408) {
      throw new Error('Request took too long. Please try a simpler query.')
    }
    
    throw new Error(error.message || 'An error occurred while processing your request.')
  }
)

export const apiService = {
  async runQuery(query) {
    try {
      const response = await api.post('/query', { query })
      const payload = response.data
      const data = payload?.data ?? payload
      return normalizeCoreResponse(data)
    } catch (error) {
      throw error
    }
  },
  
  async getHealth() {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async getMetrics() {
    try {
      const response = await api.get('/metrics')
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default apiService
