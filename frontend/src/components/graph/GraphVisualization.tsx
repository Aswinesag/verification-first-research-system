import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { GraphNode, GraphEdge } from '@/types/api'
import { cn } from '@/lib/utils'

interface GraphVisualizationProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId?: string | null
  searchQuery?: string
  onNodeClick?: (nodeId: string) => void
  onNodeHover?: (nodeId: string | null) => void
  className?: string
  graphRef?: React.MutableRefObject<any>
}

const getNodeColor = (node: GraphNode, selected: boolean, dimmed: boolean) => {
  if (selected) return '#3B82F6'
  if (dimmed) return '#374151'
  if (node.trust_level === 'high') return '#22C55E'
  if (node.trust_level === 'medium') return '#F59E0B'
  if (node.trust_level === 'low') return '#EF4444'
  return '#6B7280'
}

const getLinkColor = (type: string) => {
  if (type === 'contradicts') return 'rgba(239, 68, 68, 0.6)'
  if (type === 'supports') return 'rgba(34, 197, 94, 0.4)'
  return 'rgba(255, 255, 255, 0.2)'
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  selectedNodeId,
  searchQuery = '',
  onNodeClick,
  onNodeHover,
  className,
  graphRef: externalRef,
}) => {
  const internalRef = useRef<any>()
  const graphRef = externalRef || internalRef

  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    return new Set(
      nodes.filter((n) => n.text.toLowerCase().includes(q)).map((n) => n.id)
    )
  }, [nodes, searchQuery])

  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n })),
      links: edges.map((e) => ({ ...e })),
    }),
    [nodes, edges]
  )

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      onNodeClick?.(node.id)
    },
    [onNodeClick]
  )

  useEffect(() => {
    if (graphRef.current && nodes.length > 0) {
      graphRef.current.zoomToFit(400, 40)
    }
  }, [nodes.length, graphRef])

  if (nodes.length === 0) {
    return (
      <div className={cn('flex h-full items-center justify-center text-sm text-muted-foreground', className)}>
        No graph data available
      </div>
    )
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: GraphNode) => node.text}
        nodeColor={(node: GraphNode) => {
          const dimmed = filteredNodeIds !== null && !filteredNodeIds.has(node.id)
          return getNodeColor(node, node.id === selectedNodeId, dimmed)
        }}
        nodeRelSize={5}
        linkColor={(link: GraphEdge) => getLinkColor(link.type)}
        linkWidth={(link: GraphEdge) => (link.type === 'contradicts' ? 2 : 1)}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        onNodeHover={(node: GraphNode | null) => onNodeHover?.(node?.id ?? null)}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
        backgroundColor="transparent"
      />
    </div>
  )
}
