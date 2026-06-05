import React from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  QueryComposer,
  InvestigationTimeline,
  AgentActivityFeed,
  ClaimsExplorer,
  KnowledgeGraph,
  ConfidenceCenter,
  EvidenceExplorer,
  ClaimDetailPanel,
} from '@/components/workspace'
import { Panel } from '@/components/shared/Panel'
import { useInvestigationStore } from '@/store'
import { useInvestigation } from '@/hooks/useInvestigation'

const Workspace: React.FC = () => {
  const { loading, error, setError, response, selectedClaim } = useInvestigationStore()
  const { runInvestigation } = useInvestigation()

  const selectedClaimData =
    response?.claims.find((c) => c.claim_id === selectedClaim) || null

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Composer */}
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="mb-1">
          <h2 className="text-sm font-medium text-muted-foreground">Research Workspace</h2>
          <p className="text-xs text-muted-foreground">
            Launch investigations and explore evidence-backed findings
          </p>
        </div>
        <QueryComposer onSubmit={runInvestigation} loading={loading} />
      </div>

      {error && (
        <div className="mx-6 mt-4 flex shrink-0 items-center justify-between rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Scrollable investigation panels */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-4 p-6 pb-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel title="Investigation Timeline" subtitle="Pipeline progress" className="min-h-[280px]">
              <InvestigationTimeline />
            </Panel>
            <Panel title="Agent Activity" subtitle="Live agent actions" className="min-h-[280px]">
              <AgentActivityFeed />
            </Panel>
            <Panel title="Claims Explorer" subtitle="Research findings" className="min-h-[280px]">
              <ClaimsExplorer />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel
              title="Knowledge Graph"
              subtitle="Claim relationships and contradictions"
              className="overflow-hidden lg:col-span-2"
              noPadding
            >
              <div className="relative h-[340px] overflow-hidden">
                <KnowledgeGraph />
              </div>
            </Panel>

            <Panel title="Evidence Explorer" className="overflow-hidden" noPadding>
              <div className="h-[340px] overflow-hidden p-4">
                <EvidenceExplorer />
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {/* Confidence Center — fixed footer, visually separated */}
      <div className="shrink-0 border-t border-border bg-surface">
        <div className="px-6 py-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-foreground">Confidence Center</h3>
            <p className="text-xs text-muted-foreground">Trust and verification metrics</p>
          </div>
          <ConfidenceCenter />
        </div>
      </div>

      <ClaimDetailPanel
        claim={selectedClaimData}
        onClose={() => useInvestigationStore.getState().setSelectedClaim(null)}
      />
    </div>
  )
}

export default Workspace
