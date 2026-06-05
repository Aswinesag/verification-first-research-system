import React, { useRef } from 'react'
import { useInvestigationStore, useGraphStore } from '@/store'
import { GraphVisualization } from '@/components/graph/GraphVisualization'

export const KnowledgeGraph: React.FC = () => {
  const { response, selectedClaim, setSelectedClaim } = useInvestigationStore()
  const { graphData } = useGraphStore()
  const graphRef = useRef<any>()

  const nodes = response?.graph?.nodes || graphData?.nodes || []
  const edges = response?.graph?.edges || graphData?.edges || []

  return (
    <GraphVisualization
      nodes={nodes}
      edges={edges}
      selectedNodeId={selectedClaim}
      onNodeClick={(nodeId) => setSelectedClaim(nodeId)}
      graphRef={graphRef}
      className="h-full"
    />
  )
}
