import React from 'react'
import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Claim } from '@/types/api'

interface NodeDetailPanelProps {
  claim: Claim | null
  onClose: () => void
  onViewEvidence?: () => void
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  claim,
  onClose,
  onViewEvidence,
}) => {
  if (!claim) return null

  const status = claim.verification?.verification_status || 'pending'
  const StatusIcon =
    status === 'verified' ? CheckCircle : status === 'contradicted' ? XCircle : AlertTriangle

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-medium text-foreground">Node Details</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              'h-4 w-4',
              status === 'verified' && 'text-success',
              status === 'unsupported' && 'text-warning',
              status === 'contradicted' && 'text-danger'
            )}
          />
          <Badge variant="outline" className="text-xs capitalize">
            {status}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {claim.trust_level} trust
          </Badge>
        </div>

        <p className="text-sm leading-relaxed text-foreground">{claim.text}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="text-lg font-semibold text-foreground">
              {formatPercentage(claim.confidence)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Uncertainty</p>
            <p className="text-lg font-semibold text-foreground">
              {formatPercentage(claim.uncertainty)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Evidence</p>
            <p className="text-lg font-semibold text-foreground">{claim.sources.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Contradictions</p>
            <p className="text-lg font-semibold text-foreground">
              {claim.verification?.contradiction_flags?.length || 0}
            </p>
          </div>
        </div>

        {claim.verification?.explanation && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Verification Notes</p>
            <p className="text-sm text-foreground">{claim.verification.explanation}</p>
          </div>
        )}

        {onViewEvidence && (
          <Button variant="outline" size="sm" className="w-full" onClick={onViewEvidence}>
            View Evidence
          </Button>
        )}
      </div>
    </div>
  )
}
