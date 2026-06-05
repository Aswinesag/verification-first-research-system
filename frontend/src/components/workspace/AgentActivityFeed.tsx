import React from 'react'
import { useInvestigationStore } from '../../store'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle, AlertCircle, Loader2, Cpu, Database, FileText, Network, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const agentIcons = {
  'Planner': Cpu,
  'Retriever': Database,
  'Executor': FileText,
  'Verifier': Shield,
  'Graph Engine': Network,
  'Confidence Engine': Cpu,
}

export const AgentActivityFeed: React.FC = () => {
  const { agentActivities } = useInvestigationStore()

  const getIcon = (agent: string) => {
    const Icon = agentIcons[agent as keyof typeof agentIcons] || Cpu
    return <Icon className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-success" />
      case 'error':
        return <AlertCircle className="h-3 w-3 text-danger" />
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-warning" />
      default:
        return <Loader2 className="h-3 w-3 text-primary animate-spin" />
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Agent Activity</h4>
        <span className="text-xs text-muted-foreground">{agentActivities.length} events</span>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {agentActivities.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No agent activity yet
          </div>
        ) : (
          agentActivities.slice().reverse().map((activity, index) => (
            <div
              key={`${activity.timestamp}-${index}`}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                activity.status === 'error' && 'border-danger/20 bg-danger/5',
                activity.status === 'warning' && 'border-warning/20 bg-warning/5',
                activity.status === 'success' && 'border-success/20 bg-success/5'
              )}
            >
              <div className="mt-0.5 text-muted-foreground">
                {getIcon(activity.agent)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{activity.agent}</p>
                  {getStatusIcon(activity.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activity.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDateTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
