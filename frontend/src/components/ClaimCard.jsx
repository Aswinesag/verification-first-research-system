import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useStore } from '../store/useStore'
import { clsx } from 'clsx'

const ClaimCard = ({ claim, index, isSelected, onSelect }) => {
  const { setSelectedClaim } = useStore()

  const getTrustColor = (trustLevel) => {
    switch (trustLevel) {
      case 'high':
        return 'bg-vara-success text-vara-darker'
      case 'medium':
        return 'bg-vara-warning text-vara-darker'
      case 'low':
        return 'bg-vara-danger text-white'
      default:
        return 'bg-vara-info text-white'
    }
  }

  const getTrustIcon = (trustLevel) => {
    switch (trustLevel) {
      case 'high':
        return <CheckCircle className="h-4 w-4" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />
      case 'low':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.75) return 'bg-vara-success'
    if (confidence >= 0.4) return 'bg-vara-warning'
    return 'bg-vara-danger'
  }

  const getUncertaintyColor = (uncertainty) => {
    if (uncertainty <= 0.25) return 'bg-vara-success'
    if (uncertainty <= 0.6) return 'bg-vara-warning'
    return 'bg-vara-danger'
  }

  const handleClick = () => {
    setSelectedClaim(claim)
    onSelect?.(claim)
  }

  return (
    <div
      style={{
        backgroundColor: '#050508',
        border: '1px solid #2a2a3e',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        transform: isSelected ? 'translateY(-8px)' : 'translateY(0)',
        borderColor: isSelected ? '#00ff88' : '#2a2a3e'
      }}
      onClick={handleClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: getTrustColor(claim.trust_level),
            color: '#ffffff'
          }}>
            {getTrustIcon(claim.trust_level)}
            {claim.trust_level?.toUpperCase()}
          </span>
        </div>
        
        <div style={{
          width: '24px',
          height: '24px',
          transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          color: isSelected ? '#00ff88' : '#a0a0b8'
        }}>
          <ChevronRight />
        </div>
      </div>

      <p style={{ color: '#e8e8e8', marginBottom: '16px', lineHeight: 1.5 }}>{claim.text}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Confidence Bar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#a0a0b8' }}>Confidence</span>
            <span style={{ fontSize: '12px', color: '#e8e8e8', fontWeight: 'bold' }}>{Math.round((claim.confidence || 0) * 100)}%</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#2a2a3e', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
          <div style={{
              height: '8px',
              backgroundColor: getConfidenceColor(claim.confidence),
              borderRadius: '4px',
              transition: 'width 0.8s ease',
              width: `${(claim.confidence || 0) * 100}%`
            }}></div>
          </div>
        </div>

        {/* Uncertainty Bar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#a0a0b8' }}>Uncertainty</span>
            <span style={{ fontSize: '12px', color: '#e8e8e8', fontWeight: 'bold' }}>{Math.round((claim.uncertainty || 0) * 100)}%</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#2a2a3e', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '8px',
              backgroundColor: getUncertaintyColor(claim.uncertainty),
              borderRadius: '4px',
              transition: 'width 0.8s ease',
              width: `${(claim.uncertainty || 0) * 100}%`
            }}></div>
          </div>
        </div>

        {/* Sources */}
        {claim.sources && claim.sources.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a0a0b8' }}>
            <Shield className="h-3 w-3" />
            <span>{claim.sources.length} source{claim.sources.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClaimCard
