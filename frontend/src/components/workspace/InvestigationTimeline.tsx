import React from 'react'
import { useInvestigationStore } from '@/store'
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const stages = [
  { id: 'goal', name: 'Goal Definition', keywords: ['goal'] },
  { id: 'decomposition', name: 'Task Decomposition', keywords: ['decomposition', 'task'] },
  { id: 'retrieval', name: 'Evidence Retrieval', keywords: ['retrieval', 'evidence'] },
  { id: 'generation', name: 'Claim Generation', keywords: ['generation', 'claim'] },
  { id: 'verification', name: 'Verification', keywords: ['verification'] },
  { id: 'graph', name: 'Graph Construction', keywords: ['graph'] },
  { id: 'confidence', name: 'Confidence Analysis', keywords: ['confidence'] },
]

export const InvestigationTimeline: React.FC = () => {
  const { executionSteps, loading, response } = useInvestigationStore()

  const getStageStatus = (stageId: string, keywords: string[]) => {
    if (loading) {
      const step = executionSteps.find((s) =>
        keywords.some((k) => s.step.toLowerCase().includes(k))
      )
      if (step) return step.status
      const stageIndex = stages.findIndex((s) => s.id === stageId)
      const activeIndex = executionSteps.findIndex((s) => s.status === 'in_progress')
      if (activeIndex >= stageIndex) return 'completed'
      if (activeIndex === stageIndex - 1) return 'in_progress'
      return 'pending'
    }
    if (response) return 'completed'
    return 'pending'
  }

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-danger" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex h-full flex-col space-y-2 overflow-y-auto custom-scrollbar">
      {loading && (
        <div className="mb-1 text-xs text-primary animate-pulse">Processing investigation...</div>
      )}
      {stages.map((stage) => {
        const status = getStageStatus(stage.id, stage.keywords)

        return (
          <div
            key={stage.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
              status === 'in_progress' && 'border-primary/50 bg-primary/5',
              status === 'completed' && 'border-success/20 bg-success/5',
              status === 'failed' && 'border-danger/20 bg-danger/5',
              status === 'pending' && 'border-border bg-background'
            )}
          >
            {getStageIcon(status)}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{stage.name}</p>
              {status === 'in_progress' && (
                <p className="text-xs text-primary">Active</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
