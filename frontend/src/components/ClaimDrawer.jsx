import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, AlertTriangle, CheckCircle, Info, ExternalLink, Clock } from 'lucide-react'
import { useStore } from '../store/useStore'
import { clsx } from 'clsx'

const ClaimDrawer = () => {
  const { selectedClaim, setSelectedClaim } = useStore()

  const closeDrawer = () => {
    setSelectedClaim(null)
  }

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
        return <CheckCircle className="h-5 w-5" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />
      case 'low':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
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

  if (!selectedClaim) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeDrawer}
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-vara-card border-l border-vara-border z-50 overflow-y-auto"
      >
        <div className="sticky top-0 bg-vara-card border-b border-vara-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-vara-text">Claim Details</h2>
            <button
              onClick={closeDrawer}
              className="p-2 hover:bg-vara-darker rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-vara-text-secondary" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Trust Badge */}
          <div className="flex items-center gap-4">
            <span className={clsx(
              'inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium',
              getTrustColor(selectedClaim.trust_level)
            )}>
              {getTrustIcon(selectedClaim.trust_level)}
              {selectedClaim.trust_level?.toUpperCase()} TRUST
            </span>
            
            <div className="flex items-center gap-2 text-sm text-vara-text-secondary">
              <Clock className="h-4 w-4" />
              Claim ID: {selectedClaim.claim_id?.slice(0, 8)}...
            </div>
          </div>

          {/* Claim Text */}
          <div>
            <h3 className="text-lg font-semibold text-vara-text mb-3">Claim</h3>
            <div className="bg-vara-darker rounded-lg p-4">
              <p className="text-vara-text leading-relaxed">{selectedClaim.text}</p>
            </div>
          </div>

          {/* Confidence & Uncertainty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-vara-text mb-3">Confidence</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-vara-text-secondary">Score</span>
                  <span className="text-lg font-bold text-vara-text">
                    {Math.round((selectedClaim.confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-vara-border rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(selectedClaim.confidence || 0) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className={clsx('h-full rounded-full', getConfidenceColor(selectedClaim.confidence))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-vara-text mb-3">Uncertainty</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-vara-text-secondary">Score</span>
                  <span className="text-lg font-bold text-vara-text">
                    {Math.round((selectedClaim.uncertainty || 0) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-vara-border rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(selectedClaim.uncertainty || 0) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className={clsx('h-full rounded-full', getUncertaintyColor(selectedClaim.uncertainty))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          {selectedClaim.verification && (
            <div>
              <h3 className="text-lg font-semibold text-vara-text mb-3">Verification Analysis</h3>
              <div className="bg-vara-darker rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-vara-text-secondary">Status</span>
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    selectedClaim.verification.verification_status === 'verified' 
                      ? 'bg-vara-success text-vara-darker'
                      : 'bg-vara-warning text-vara-darker'
                  )}>
                    {selectedClaim.verification.verification_status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-vara-text-secondary">Evidence Quality</span>
                  <span className="text-sm text-vara-text">
                    {Math.round((selectedClaim.verification.evidence_quality_score || 0) * 100)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-vara-text-secondary">Reasoning Validity</span>
                  <span className="text-sm text-vara-text">
                    {Math.round((selectedClaim.verification.reasoning_validity_score || 0) * 100)}%
                  </span>
                </div>

                {selectedClaim.verification.explanation && (
                  <div className="pt-2 border-t border-vara-border">
                    <p className="text-sm text-vara-text-secondary">
                      {selectedClaim.verification.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence Sources */}
          {selectedClaim.sources && selectedClaim.sources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-vara-text mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-vara-accent" />
                Evidence Sources ({selectedClaim.sources.length})
              </h3>
              <div className="space-y-3">
                {selectedClaim.sources.map((source, index) => (
                  <div key={index} className="bg-vara-darker rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={clsx(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        source.source === 'web_search' ? 'bg-vara-info text-white' :
                        source.source === 'dataset' ? 'bg-vara-success text-vara-darker' :
                        source.source === 'retrieved_doc' ? 'bg-vara-warning text-vara-darker' :
                        'bg-vara-card text-vara-text'
                      )}>
                        {source.source?.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vara-accent hover:text-vara-accent/80 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    
                    <p className="text-sm text-vara-text leading-relaxed">
                      {source.snippet}
                    </p>
                    
                    {source.score && (
                      <div className="mt-2 text-xs text-vara-text-secondary">
                        Relevance Score: {Math.round(source.score * 100)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uncertainty Components */}
          {selectedClaim.uncertainty && (
            <div>
              <h3 className="text-lg font-semibold text-vara-text mb-3">Uncertainty Analysis</h3>
              <div className="bg-vara-darker rounded-lg p-4 space-y-3">
                {selectedClaim.uncertainty.components && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-vara-text-secondary">Evidence Score</span>
                      <span className="text-sm text-vara-text">
                        {Math.round((selectedClaim.uncertainty.components.evidence_score || 0) * 100)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-vara-text-secondary">Reasoning Score</span>
                      <span className="text-sm text-vara-text">
                        {Math.round((selectedClaim.uncertainty.components.reasoning_score || 0) * 100)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-vara-text-secondary">Source Diversity</span>
                      <span className="text-sm text-vara-text">
                        {Math.round((selectedClaim.uncertainty.components.source_diversity || 0) * 100)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-vara-text-secondary">Contradiction Penalty</span>
                      <span className="text-sm text-vara-text">
                        {Math.round((selectedClaim.uncertainty.components.contradiction_penalty || 0) * 100)}%
                      </span>
                    </div>
                  </>
                )}
                
                {selectedClaim.uncertainty.explanation && (
                  <div className="pt-2 border-t border-vara-border">
                    <p className="text-sm text-vara-text-secondary">
                      {selectedClaim.uncertainty.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ClaimDrawer
