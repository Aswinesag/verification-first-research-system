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
      <div className="border-b border-border px-6 py-5">
        <div className="mb-1">
          <h2 className="text-sm font-medium text-muted-foreground">Research Workspace</h2>
          <p className="text-xs text-muted-foreground">
            Launch investigations and explore evidence-backed findings
          </p>
        </div>
        <QueryComposer onSubmit={runInvestigation} loading={loading} />
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="grid h-full grid-cols-12 gap-4">
          <Panel title="Investigation Timeline" className="col-span-12 lg:col-span-4 h-80 lg:h-auto" subtitle="Pipeline progress">
            <InvestigationTimeline />
          </Panel>

          <Panel title="Agent Activity" className="col-span-12 lg:col-span-4 h-80 lg:h-auto" subtitle="Live agent actions">
            <AgentActivityFeed />
          </Panel>

          <Panel title="Claims Explorer" className="col-span-12 lg:col-span-4 h-96 lg:h-auto" subtitle="Research findings">
            <ClaimsExplorer />
          </Panel>

          <Panel
            title="Knowledge Graph"
            className="col-span-12 lg:col-span-8 h-[420px]"
            subtitle="Claim relationships and contradictions"
            noPadding
          >
            <div className="h-[360px] p-2">
              <KnowledgeGraph />
            </div>
          </Panel>

          <Panel title="Evidence Explorer" className="col-span-12 lg:col-span-4 h-[420px]" noPadding>
            <div className="h-[360px] p-4">
              <EvidenceExplorer />
            </div>
          </Panel>
        </div>
      </div>

      <div className="border-t border-border px-6 py-5">
        <Panel title="Confidence Center" subtitle="Trust and verification metrics" className="border-0 bg-transparent">
          <ConfidenceCenter />
        </Panel>
      </div>

      <ClaimDetailPanel
        claim={selectedClaimData}
        onClose={() => useInvestigationStore.getState().setSelectedClaim(null)}
      />
    </div>
  )
}

export default Workspace
