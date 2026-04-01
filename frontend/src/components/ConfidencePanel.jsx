import React from 'react'
import { TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react'
import { useStore } from '../store/useStore'

const ConfidencePanel = () => {
  const { getOverallConfidence, getRiskLevel, response } = useStore()

  const overallConfidence = getOverallConfidence()
  const riskLevel = getRiskLevel()
  const claimsCount = response?.claims?.length || 0

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return { color: '#26de81', backgroundColor: 'rgba(38, 222, 129, 0.1)', borderColor: 'rgba(38, 222, 129, 0.3)' }
      case 'medium':
        return { color: '#ffa502', backgroundColor: 'rgba(255, 165, 2, 0.1)', borderColor: 'rgba(255, 165, 2, 0.3)' }
      case 'high':
        return { color: '#ff4757', backgroundColor: 'rgba(255, 71, 87, 0.1)', borderColor: 'rgba(255, 71, 87, 0.3)' }
      default:
        return { color: '#4834d4', backgroundColor: 'rgba(72, 52, 212, 0.1)', borderColor: 'rgba(72, 52, 212, 0.3)' }
    }
  }

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'low':
        return <Shield className="h-5 w-5" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />
      case 'high':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.75) return '#26de81'
    if (confidence >= 0.4) return '#ffa502'
    return '#ff4757'
  }

  const getConfienceLabel = (confidence) => {
    if (confidence >= 0.75) return 'High'
    if (confidence >= 0.4) return 'Medium'
    return 'Low'
  }

  if (!response) return null

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e8e8e8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp className="h-5 w-5" style={{ color: '#00ff88' }} />
          System Confidence
        </h3>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '14px',
          fontWeight: 500,
          border: '1px solid',
          ...getRiskColor(riskLevel)
        }}>
          {getRiskIcon(riskLevel)}
          {riskLevel?.toUpperCase()} RISK
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Overall Confidence */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#a0a0b8' }}>Overall Confidence</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#e8e8e8' }}>
                {Math.round(overallConfidence * 100)}%
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'medium',
                color: 'white',
                backgroundColor: getConfidenceColor(overallConfidence)
              }}>
                {getConfienceLabel(overallConfidence)}
              </span>
            </div>
          </div>
          
          <div style={{ width: '100%', backgroundColor: '#2a2a3e', borderRadius: '4px', height: '16px', overflow: 'hidden' }}>
            <div style={{
              height: '16px',
              backgroundColor: getConfidenceColor(overallConfidence),
              borderRadius: '4px',
              transition: 'width 1s ease-out',
              width: `${overallConfidence * 100}%`
            }}></div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ backgroundColor: '#050508', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e8e8e8', marginBottom: '4px' }}>
              {claimsCount}
            </div>
            <div style={{ fontSize: '12px', color: '#a0a0b8' }}>Claims Generated</div>
          </div>
          
          <div style={{ backgroundColor: '#050508', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e8e8e8', marginBottom: '4px' }}>
              {response.subtasks?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#a0a0b8' }}>Subtasks</div>
          </div>
          
          <div style={{ backgroundColor: '#050508', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e8e8e8', marginBottom: '4px' }}>
              {response.graph?.edges?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#a0a0b8' }}>Relationships</div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div style={{ backgroundColor: '#050508', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'medium', color: '#e8e8e8', marginBottom: '8px' }}>Risk Assessment</h4>
          <p style={{ fontSize: '12px', color: '#a0a0b8', lineHeight: '1.5' }}>
            {riskLevel === 'low' && 'The system has high confidence in the generated claims with minimal uncertainty and contradictions.'}
            {riskLevel === 'medium' && 'The system shows moderate confidence with some uncertainty detected. Claims should be verified independently.'}
            {riskLevel === 'high' && 'The system has low confidence with high uncertainty and/or contradictions. Independent verification is strongly recommended.'}
            {!riskLevel && 'Risk assessment not available.'}
          </p>
        </div>

        {/* Trust Distribution */}
        {claimsCount > 0 && (
          <div style={{ backgroundColor: '#050508', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'medium', color: '#e8e8e8', marginBottom: '12px' }}>Trust Distribution</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['high', 'medium', 'low'].map((trust) => {
                const count = response.claims.filter(c => c.trust_level === trust).length
                const percentage = (count / claimsCount) * 100
                
                return (
                  <div key={trust} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#a0a0b8', width: '48px', textTransform: 'capitalize' }}>{trust}</span>
                    <div style={{ flex: 1, backgroundColor: '#2a2a3e', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        height: '8px',
                        borderRadius: '4px',
                        transition: 'width 0.8s ease',
                        width: `${percentage}%`,
                        backgroundColor: trust === 'high' ? '#26de81' : trust === 'medium' ? '#ffa502' : '#ff4757'
                      }}></div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#e8e8e8', width: '32px', textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ConfidencePanel
