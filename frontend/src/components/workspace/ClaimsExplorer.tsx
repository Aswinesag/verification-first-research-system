import React, { useState } from 'react'
import { useInvestigationStore } from '@/store'
import { formatPercentage } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, XCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ClaimsExplorer: React.FC = () => {
  const { response, selectedClaim, setSelectedClaim } = useInvestigationStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const claims = response?.claims || []

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-3.5 w-3.5 text-success" />
      case 'unsupported':
        return <AlertTriangle className="h-3.5 w-3.5 text-warning" />
      case 'contradicted':
        return <XCircle className="h-3.5 w-3.5 text-danger" />
      default:
        return <FileText className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const getTrustColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-success'
      case 'medium':
        return 'text-warning'
      case 'low':
        return 'text-danger'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="flex h-full flex-col space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{claims.length} claims</span>
        {selectedClaim && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedClaim(selectedClaim)}
          >
            View details
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
        {claims.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No claims yet — run an investigation to generate findings
          </div>
        ) : (
          claims.map((claim) => {
            const expanded = expandedId === claim.claim_id
            const sourceTypes = new Set(claim.sources.map((s) => s.source)).size
            const contradictions = claim.verification?.contradiction_flags?.length || 0

            return (
              <div
                key={claim.claim_id}
                className={cn(
                  'rounded-lg border transition-colors',
                  selectedClaim === claim.claim_id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-border/80'
                )}
              >
                <button
                  type="button"
                  className="w-full p-3 text-left"
                  onClick={() => {
                    setSelectedClaim(claim.claim_id)
                    setExpandedId(expanded ? null : claim.claim_id)
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground line-clamp-2">{claim.text}</p>
                    {claim.verification &&
                      getVerificationIcon(claim.verification.verification_status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className={cn('font-medium', getTrustColor(claim.trust_level))}>
                      {formatPercentage(claim.confidence)} conf
                    </span>
                    <span className="text-muted-foreground">
                      {formatPercentage(claim.uncertainty)} unc
                    </span>
                    <span className="text-muted-foreground">{claim.sources.length} evidence</span>
                    <span className="text-muted-foreground">{sourceTypes} sources</span>
                    {contradictions > 0 && (
                      <span className="text-danger">{contradictions} conflicts</span>
                    )}
                    {claim.verification && (
                      <Badge variant="outline" className="h-5 text-[10px] capitalize">
                        {claim.verification.verification_status}
                      </Badge>
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    <p className="mb-2 text-xs text-muted-foreground">{claim.text}</p>
                    {claim.verification?.explanation && (
                      <p className="text-xs text-muted-foreground">
                        {claim.verification.explanation}
                      </p>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs"
                      onClick={() => setSelectedClaim(claim.claim_id)}
                    >
                      Open full details
                    </Button>
                  </div>
                )}

                <button
                  type="button"
                  className="flex w-full items-center justify-center border-t border-border py-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setExpandedId(expanded ? null : claim.claim_id)}
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
