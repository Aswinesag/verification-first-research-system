import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Network } from 'lucide-react'
import { useStore } from '../store/useStore'

const GRAPH_HEIGHT = 384

const GraphPanel = () => {
  const { response, selectedClaim, setSelectedClaim } = useStore()
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: GRAPH_HEIGHT })

  const nodes = response?.graph?.nodes || []
  const edges = response?.graph?.edges || []
  const claims = response?.claims || []
  const renderWidth = Math.max(dimensions.width, 320)
  const renderHeight = Math.max(dimensions.height, GRAPH_HEIGHT)

  // Measure the container, not the SVG itself, to avoid width=0 loops.
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.max(rect.width, 320),
          height: Math.max(rect.height, GRAPH_HEIGHT),
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Simple force-directed graph implementation
  const [graphState, setGraphState] = useState({
    nodePositions: new Map(),
    simulation: null
  })

  useEffect(() => {
    if (nodes.length === 0) return

    // Initialize positions
    const positions = new Map()
    nodes.forEach((node) => {
      positions.set(node.id, {
        x: 20 + Math.random() * (renderWidth - 40),
        y: 20 + Math.random() * (renderHeight - 40),
        vx: 0,
        vy: 0
      })
    })

    setGraphState({ nodePositions: positions, simulation: null })
  }, [nodes, renderWidth, renderHeight])

  // Simple physics simulation
  useEffect(() => {
    if (nodes.length === 0) return

    const simulate = () => {
      setGraphState((prev) => {
        if (!prev.nodePositions.size) return prev

        const positions = new Map(prev.nodePositions)

        // Apply forces
        positions.forEach((pos, nodeId) => {
          let fx = 0, fy = 0

          // Repulsion between nodes
          positions.forEach((otherPos, otherNodeId) => {
            if (nodeId !== otherNodeId) {
              const dx = pos.x - otherPos.x
              const dy = pos.y - otherPos.y
              const distance = Math.sqrt(dx * dx + dy * dy) + 0.01
              const force = 1000 / (distance * distance)
              fx += (dx / distance) * force
              fy += (dy / distance) * force
            }

          })

          // Attraction along edges
          edges.forEach(edge => {
            const otherId = edge.source === nodeId ? edge.target :
                           edge.target === nodeId ? edge.source : null
            if (otherId) {
              const otherPos = positions.get(otherId)
              if (otherPos) {
                const dx = otherPos.x - pos.x
                const dy = otherPos.y - pos.y
                const distance = Math.sqrt(dx * dx + dy * dy) + 0.01
                const force = distance * 0.01
                fx += (dx / distance) * force
                fy += (dy / distance) * force
              }
            }
          })

          // Center gravity
          const centerX = renderWidth / 2
          const centerY = renderHeight / 2
          fx += (centerX - pos.x) * 0.001
          fy += (centerY - pos.y) * 0.001

          // Update velocity and position
          pos.vx = (pos.vx + fx) * 0.8
          pos.vy = (pos.vy + fy) * 0.8
          pos.x += pos.vx
          pos.y += pos.vy

          // Keep within bounds
          pos.x = Math.max(20, Math.min(renderWidth - 20, pos.x))
          pos.y = Math.max(20, Math.min(renderHeight - 20, pos.y))
        })

        return { ...prev, nodePositions: positions }
      })
    }

    const interval = setInterval(simulate, 50)
    return () => clearInterval(interval)
  }, [nodes.length, edges, renderWidth, renderHeight])

  const getNodeColor = (node) => {
    if (selectedClaim?.claim_id === node.id) return '#00ff88'
    
    const trustLevel = node.trust_level
    switch (trustLevel) {
      case 'high': return '#26de81'
      case 'medium': return '#ffa502'
      case 'low': return '#ff4757'
      default: return '#4834d4'
    }
  }

  const getEdgeColor = (edge) => {
    switch (edge.type) {
      case 'supports': return '#26de81'
      case 'contradicts': return '#ff4757'
      default: return '#a0a0b8'
    }
  }

  const handleNodeClick = (node) => {
    const claim = claims.find(c => c.claim_id === node.id)
    if (claim) {
      setSelectedClaim(claim)
    }
  }

  const getNodeSize = (node) => {
    const claim = claims.find(c => c.claim_id === node.id)
    if (!claim) return 8
    return 8 + (claim.confidence || 0) * 12
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-vara-card rounded-2xl border border-vara-border p-6 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-vara-text flex items-center gap-2">
          <Network className="h-5 w-5 text-vara-accent" />
          Knowledge Graph
        </h3>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-vara-success rounded-full"></div>
            <span className="text-vara-text-secondary">Supports</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-vara-danger rounded-full"></div>
            <span className="text-vara-text-secondary">Contradicts</span>
          </div>
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-96 text-vara-text-secondary">
          <div className="text-center">
            <Network className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No knowledge graph data available</p>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="relative h-96">
          <svg
            ref={canvasRef}
            width={renderWidth}
            height={renderHeight}
            className="w-full h-96"
            viewBox={`0 0 ${renderWidth} ${renderHeight}`}
          >
            {/* Edges */}
            {edges.map((edge, index) => {
              const sourcePos = graphState.nodePositions.get(edge.source)
              const targetPos = graphState.nodePositions.get(edge.target)
              
              if (!sourcePos || !targetPos) return null
              
              return (
                <g key={index}>
                  <line
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={getEdgeColor(edge)}
                    strokeWidth={2}
                    strokeOpacity={0.6}
                  />
                  <circle
                    cx={(sourcePos.x + targetPos.x) / 2}
                    cy={(sourcePos.y + targetPos.y) / 2}
                    r="3"
                    fill={getEdgeColor(edge)}
                  />
                </g>
              )
            })}
            
            {/* Nodes */}
            {Array.from(graphState.nodePositions.entries()).map(([nodeId, pos]) => {
              const node = nodes.find(n => n.id === nodeId)
              if (!node) return null
              
              const isSelected = selectedClaim?.claim_id === nodeId
              const isHovered = hoveredNode === nodeId
              const size = getNodeSize(node)
              
              return (
                <g key={nodeId}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size}
                    fill={getNodeColor(node)}
                    stroke={isSelected ? '#00ff88' : 'transparent'}
                    strokeWidth={isSelected ? 3 : 0}
                    opacity={isHovered ? 1 : 0.8}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredNode(nodeId)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                  />
                  
                  {isHovered && (
                    <foreignObject
                      x={pos.x - 100}
                      y={pos.y - 60}
                      width="200"
                      height="50"
                    >
                      <div className="bg-vara-darker border border-vara-border rounded-lg p-2 text-xs text-vara-text">
                        <div className="font-medium truncate">{node.text}</div>
                        <div className="text-vara-text-secondary">
                          Trust: {node.trust_level}
                        </div>
                      </div>
                    </foreignObject>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </motion.div>
  )
}

export default GraphPanel
