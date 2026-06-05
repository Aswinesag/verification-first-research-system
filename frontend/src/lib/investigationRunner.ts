import type { ExecutionStep, AgentActivity } from '@/types/investigation'
import type { VARAResponse } from '@/types/api'

const STAGES: { id: string; step: string; agent: AgentActivity['agent']; message: string }[] = [
  { id: 'goal', step: 'Goal Definition', agent: 'Planner', message: 'Parsed investigation objective' },
  { id: 'decomposition', step: 'Task Decomposition', agent: 'Planner', message: 'Generated subtasks' },
  { id: 'retrieval', step: 'Evidence Retrieval', agent: 'Retriever', message: 'Retrieved documents' },
  { id: 'generation', step: 'Claim Generation', agent: 'Planner', message: 'Generated evidence-based claims' },
  { id: 'verification', step: 'Verification', agent: 'Verifier', message: 'Verified claim validity' },
  { id: 'graph', step: 'Graph Construction', agent: 'Graph Engine', message: 'Built knowledge relationships' },
  { id: 'confidence', step: 'Confidence Analysis', agent: 'Confidence Engine', message: 'Assigned confidence scores' },
]

export function createInitialSteps(): ExecutionStep[] {
  return STAGES.map((s) => ({
    step: s.step,
    status: 'pending',
    timestamp: Date.now(),
  }))
}

export function buildActivitiesFromResponse(
  query: string,
  response: VARAResponse
): AgentActivity[] {
  const activities: AgentActivity[] = [
    {
      agent: 'Planner',
      message: `Decomposed goal: "${query.slice(0, 80)}${query.length > 80 ? '…' : ''}"`,
      timestamp: Date.now() - 6000,
      status: 'success',
    },
  ]

  const subtaskCount = response.subtasks.length
  if (subtaskCount > 0) {
    activities.push({
      agent: 'Planner',
      message: `Generated ${subtaskCount} subtask${subtaskCount !== 1 ? 's' : ''}`,
      timestamp: Date.now() - 5000,
      status: 'success',
    })
  }

  const sourceCount = response.claims.reduce((sum, c) => sum + c.sources.length, 0)
  activities.push({
    agent: 'Retriever',
    message: `Retrieved ${sourceCount} evidence source${sourceCount !== 1 ? 's' : ''}`,
    timestamp: Date.now() - 4000,
    status: 'success',
  })

  const unsupported = response.claims.filter(
    (c) => c.verification?.verification_status === 'unsupported'
  ).length
  activities.push({
    agent: 'Verifier',
    message:
      unsupported > 0
        ? `Found ${unsupported} unsupported claim${unsupported !== 1 ? 's' : ''}`
        : `Verified ${response.claims.length} claim${response.claims.length !== 1 ? 's' : ''}`,
    timestamp: Date.now() - 3000,
    status: unsupported > 0 ? 'warning' : 'success',
  })

  const edgeCount = response.graph.edges.length
  activities.push({
    agent: 'Graph Engine',
    message: `Built ${edgeCount} relationship${edgeCount !== 1 ? 's' : ''} across ${response.graph.nodes.length} nodes`,
    timestamp: Date.now() - 2000,
    status: 'success',
  })

  activities.push({
    agent: 'Confidence Engine',
    message: `Overall confidence: ${Math.round(response.overall_confidence * 100)}% · Risk: ${response.risk_level}`,
    timestamp: Date.now() - 1000,
    status: 'success',
  })

  return activities
}

export function completeAllSteps(): ExecutionStep[] {
  return STAGES.map((s) => ({
    step: s.step,
    status: 'completed',
    timestamp: Date.now(),
  }))
}

export async function simulateInvestigationProgress(
  onStepUpdate: (steps: ExecutionStep[]) => void,
  onActivity: (activity: AgentActivity) => void,
  signal?: { cancelled: boolean }
): Promise<void> {
  const steps = createInitialSteps()
  const delays = [400, 500, 800, 600, 700, 500, 400]

  for (let i = 0; i < STAGES.length; i++) {
    if (signal?.cancelled) return

    const updated = steps.map((step, idx) => {
      if (idx < i) return { ...step, status: 'completed' as const }
      if (idx === i) return { ...step, status: 'in_progress' as const, timestamp: Date.now() }
      return step
    })
    onStepUpdate(updated)

    await new Promise((r) => setTimeout(r, delays[i]))
    if (signal?.cancelled) return

    onActivity({
      agent: STAGES[i].agent,
      message: STAGES[i].message,
      timestamp: Date.now(),
      status: 'success',
    })
  }

  onStepUpdate(completeAllSteps())
}
