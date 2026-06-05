import React from 'react'
import { useInvestigationStore } from '@/store'
import { formatPercentage } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Shield, AlertTriangle, CheckCircle, FileText, Layers, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ConfidenceCenter: React.FC = () => {
  const { response } = useInvestigationStore()

  const claims = response?.claims || []
  const overallConfidence = response?.overall_confidence || 0
  const riskLevel = response?.risk_level || 'unknown'

  const verifiedClaims = claims.filter(
    (c) => c.verification?.verification_status === 'verified'
  ).length
  const totalSources = claims.reduce((sum, c) => sum + c.sources.length, 0)
  const uniqueSourceTypes = new Set(
    claims.flatMap((c) => c.sources.map((s) => s.source))
  ).size
  const contradictions = claims.filter(
    (c) => c.verification?.contradiction_flags && c.verification.contradiction_flags.length > 0
  ).length
  const verificationCoverage = claims.length ? verifiedClaims / claims.length : 0
  const evidenceCoverage = claims.length
    ? claims.filter((c) => c.sources.length > 0).length / claims.length
    : 0
  const trustScore = overallConfidence * verificationCoverage

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-danger'
      case 'medium':
        return 'text-warning'
      case 'low':
        return 'text-success'
      default:
        return 'text-muted-foreground'
    }
  }

  if (!response || claims.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Confidence metrics will appear after an investigation completes
      </div>
    )
  }

  const metrics = [
    {
      label: 'Overall Confidence',
      value: formatPercentage(overallConfidence),
      icon: Shield,
      detail: <Progress value={overallConfidence * 100} className="mt-2 h-1.5" />,
      span: 'col-span-2',
    },
    {
      label: 'Trust Score',
      value: formatPercentage(trustScore),
      icon: Target,
      detail: <p className="mt-1 text-xs text-muted-foreground">Confidence × verification rate</p>,
    },
    {
      label: 'Risk Level',
      value: riskLevel,
      icon: AlertTriangle,
      detail: null,
      valueClass: cn('capitalize', getRiskColor(riskLevel)),
    },
    {
      label: 'Evidence Coverage',
      value: formatPercentage(evidenceCoverage),
      icon: FileText,
      detail: <p className="mt-1 text-xs text-muted-foreground">{totalSources} total sources</p>,
    },
    {
      label: 'Verification Coverage',
      value: formatPercentage(verificationCoverage),
      icon: CheckCircle,
      detail: (
        <p className="mt-1 text-xs text-muted-foreground">
          {verifiedClaims} of {claims.length} verified
        </p>
      ),
    },
    {
      label: 'Source Diversity',
      value: String(uniqueSourceTypes),
      icon: Layers,
      detail: <p className="mt-1 text-xs text-muted-foreground">unique source types</p>,
    },
    {
      label: 'Contradictions',
      value: String(contradictions),
      icon: AlertTriangle,
      detail: <p className="mt-1 text-xs text-muted-foreground">conflicts detected</p>,
      valueClass: contradictions > 0 ? 'text-danger' : 'text-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <div
            key={m.label}
            className={cn(
              'rounded-xl border border-border bg-background p-4',
              m.span
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
            </div>
            <p className={cn('text-2xl font-bold text-foreground capitalize', m.valueClass)}>
              {m.value}
            </p>
            {m.detail}
          </div>
        )
      })}
    </div>
  )
}
