import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Target, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import ClaimCard from './ClaimCard'

const ReasoningPanel = () => {
  const { response, selectedClaim, setSelectedClaim } = useStore()
  const [expandedSections, setExpandedSections] = useState({
    goal: true,
    subtasks: true,
    claims: true,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const claims = response?.claims || []
  const subtasks = response?.subtasks || []

  if (!response) return null

  return (
    <div className="space-y-6">
      {/* Goal Section */}
      <div className="card">
        <button
          onClick={() => toggleSection('goal')}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Target className="h-5 w-5" style={{ color: '#00ff88' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e8e8e8' }}>Goal</h3>
          </div>
          <div style={{ color: '#a0a0b8' }}>
            {expandedSections.goal ? '−' : '+'}
          </div>
        </button>
        
        {expandedSections.goal && (
          <div style={{ padding: '0 16px 16px' }}>
            <p style={{ color: '#e8e8e8', backgroundColor: '#050508', padding: '12px', borderRadius: '8px' }}>
              {response.goal}
            </p>
          </div>
        )}
      </div>

      {/* Subtasks Section */}
      {subtasks.length > 0 && (
        <div className="card">
          <button
            onClick={() => toggleSection('subtasks')}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Layers className="h-5 w-5" style={{ color: '#00ff88' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e8e8e8' }}>
                Subtasks ({subtasks.length})
              </h3>
            </div>
            <div style={{ color: '#a0a0b8' }}>
              {expandedSections.subtasks ? '−' : '+'}
            </div>
          </button>
          
          {expandedSections.subtasks && (
            <div style={{ padding: '0 16px 16px' }}>
              {subtasks.map((subtask, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#050508',
                  borderRadius: '8px'
                }}>
                  <div className="w-6 h-6" style={{
                    backgroundColor: '#00ff88',
                    color: '#0a0a0f',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'medium'
                  }}>
                    {index + 1}
                  </div>
                  <p style={{ color: '#e8e8e8', fontSize: '14px' }}>{subtask.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claims Section */}
      <div className="card">
        <button
          onClick={() => toggleSection('claims')}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain className="h-5 w-5" style={{ color: '#00ff88' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e8e8e8' }}>
              Claims ({claims.length})
            </h3>
          </div>
          <div style={{ color: '#a0a0b8' }}>
            {expandedSections.claims ? '−' : '+'}
          </div>
        </button>
        
        {expandedSections.claims && (
          <div style={{ padding: '0 16px 16px' }}>
            {claims.map((claim, index) => (
              <ClaimCard
                key={claim.claim_id || index}
                claim={claim}
                index={index}
                isSelected={selectedClaim?.claim_id === claim.claim_id}
                onSelect={setSelectedClaim}
              />
            ))}
            
            {claims.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#a0a0b8' }}>
                <Brain className="h-12 w-12 mx-auto mb-3" style={{ opacity: 0.5 }} />
                <p>No claims generated</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReasoningPanel
