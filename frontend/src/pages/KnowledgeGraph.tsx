import React, { useRef, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { useInvestigationStore, useGraphStore } from '@/store'
import { GraphVisualization } from '@/components/graph/GraphVisualization'
import { NodeDetailPanel } from '@/components/graph/NodeDetailPanel'
import { cn } from '@/lib/utils'

const KnowledgeGraphPage: React.FC = () => {
  const { response } = useInvestigationStore()
  const { graphData, selectedNode, setSelectedNode, filters, setFilters } = useGraphStore()
  const graphRef = useRef<any>()
  const [search, setSearch] = useState('')

  const rawNodes = response?.graph?.nodes || graphData?.nodes || []
  const rawEdges = response?.graph?.edges || graphData?.edges || []

  const { nodes, edges } = useMemo(() => {
    const filteredNodes = rawNodes.filter((node) => {
      if (node.trust_level === 'high' && !filters.showVerified) return false
      if (node.trust_level === 'medium' && !filters.showPartial) return false
      if (node.trust_level === 'low' && !filters.showWeak) return false
      return true
    })
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredEdges = rawEdges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    )
    return { nodes: filteredNodes, edges: filteredEdges }
  }, [rawNodes, rawEdges, filters])

  const selectedClaim =
    response?.claims.find((c) => c.claim_id === selectedNode) || null

  const edgeStats = useMemo(() => {
    const supports = edges.filter((e) => e.type === 'supports').length
    const contradicts = edges.filter((e) => e.type === 'contradicts').length
    const related = edges.filter((e) => e.type === 'related').length
    return { supports, contradicts, related }
  }, [edges])

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Knowledge Graph</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Interactive claim relationships, evidence links, and contradictions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.3)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.3)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => graphRef.current?.zoomToFit(400, 40)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {(
            [
              ['showVerified', 'High trust', 'high'],
              ['showPartial', 'Medium trust', 'medium'],
              ['showWeak', 'Low trust', 'low'],
            ] as const
          ).map(([key, label]) => (
            <Badge
              key={key}
              variant={filters[key] ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilters({ [key]: !filters[key] })}
            >
              {label}
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>{nodes.length} nodes</span>
          <span className="text-success">{edgeStats.supports} supports</span>
          <span className="text-danger">{edgeStats.contradicts} contradicts</span>
          <span>{edgeStats.related} related</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 p-4">
          {nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  No graph data available. Run an investigation in the Research Workspace.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-xl border border-border bg-surface">
              <GraphVisualization
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNode}
                searchQuery={search}
                onNodeClick={setSelectedNode}
                graphRef={graphRef}
                className="h-full rounded-xl"
              />
            </div>
          )}

          <div className="absolute bottom-8 left-8 rounded-lg border border-border bg-surface/90 p-3 text-xs backdrop-blur">
            <p className="mb-2 font-medium text-foreground">Legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-muted-foreground">High trust</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-muted-foreground">Medium trust</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger" />
                <span className="text-muted-foreground">Low trust</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('h-0.5 w-4 bg-danger/60')} />
                <span className="text-muted-foreground">Contradiction</span>
              </div>
            </div>
          </div>
        </div>

        {selectedClaim && (
          <div className="w-80 shrink-0">
            <NodeDetailPanel
              claim={selectedClaim}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeGraphPage
