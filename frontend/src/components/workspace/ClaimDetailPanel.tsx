import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Claim } from '@/types/api'

interface ClaimDetailPanelProps {
  claim: Claim | null
  onClose: () => void
}

export const ClaimDetailPanel: React.FC<ClaimDetailPanelProps> = ({ claim, onClose }) => {
  if (!claim) return null

  const status = claim.verification?.verification_status || 'pending'
  const uniqueSources = new Set(claim.sources.map((s) => s.source)).size

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-border bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">Claim Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5 custom-scrollbar">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                'capitalize',
                claim.trust_level === 'high' && 'bg-success/20 text-success',
                claim.trust_level === 'medium' && 'bg-warning/20 text-warning',
                claim.trust_level === 'low' && 'bg-danger/20 text-danger'
              )}
            >
              {claim.trust_level} trust
            </Badge>
            <Badge variant="outline" className="capitalize">
              {status}
            </Badge>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Claim
            </p>
            <p className="text-sm leading-relaxed text-foreground">{claim.text}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Confidence</p>
              <p className="mb-1 text-2xl font-bold text-foreground">
                {formatPercentage(claim.confidence)}
              </p>
              <Progress value={claim.confidence * 100} className="h-1.5" />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Uncertainty</p>
              <p className="mb-1 text-2xl font-bold text-foreground">
                {formatPercentage(claim.uncertainty)}
              </p>
              <Progress value={claim.uncertainty * 100} className="h-1.5" />
            </div>
          </div>

          {claim.verification && (
            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Verification
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Evidence quality</span>
                  <p className="font-medium">
                    {formatPercentage(claim.verification.evidence_quality_score)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reasoning validity</span>
                  <p className="font-medium">
                    {formatPercentage(claim.verification.reasoning_validity_score)}
                  </p>
                </div>
              </div>
              {claim.verification.contradiction_flags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {claim.verification.contradiction_flags.map((flag) => (
                    <Badge key={flag} variant="outline" className="text-xs text-danger">
                      {flag.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
              {claim.verification.explanation && (
                <p className="text-sm text-muted-foreground">{claim.verification.explanation}</p>
              )}
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Evidence ({claim.sources.length})
              </p>
              <span className="text-xs text-muted-foreground">
                {uniqueSources} source type{uniqueSources !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {claim.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence attached</p>
              ) : (
                claim.sources.map((source, i) => (
                  <div
                    key={source.source_id || i}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {source.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatPercentage(source.score)} relevance
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-3">{source.snippet}</p>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Source
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
