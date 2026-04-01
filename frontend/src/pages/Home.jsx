import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import QueryBar from '../components/QueryBar'
import ExecutionFlow from '../components/ExecutionFlow'
import ReasoningPanel from '../components/ReasoningPanel'
import GraphPanel from '../components/GraphPanel'
import ConfidencePanel from '../components/ConfidencePanelFixed'
import ClaimDrawer from '../components/ClaimDrawer'
import { useStore } from '../store/useStore'
import apiService from '../services/api'

const Home = () => {
  const {
    query,
    loading,
    error,
    response,
    setQuery,
    setLoading,
    setError,
    setResponse,
    setExecutionSteps,
    reset
  } = useStore()

  const buildInitialSteps = () => ([
    { step: 'planning', status: 'in_progress', timestamp: Date.now() },
    { step: 'retrieval', status: 'pending', timestamp: Date.now() },
    { step: 'execution', status: 'pending', timestamp: Date.now() },
    { step: 'verification', status: 'pending', timestamp: Date.now() },
    { step: 'graph_building', status: 'pending', timestamp: Date.now() },
    { step: 'uncertainty', status: 'pending', timestamp: Date.now() },
  ])

  const simulateExecutionSteps = () => {
    const steps = buildInitialSteps()
    setExecutionSteps(steps)

    // Simulate step progression
    const stepProgression = [
      { step: 'planning', delay: 500 },
      { step: 'retrieval', delay: 1500 },
      { step: 'execution', delay: 3000 },
      { step: 'verification', delay: 4500 },
      { step: 'graph_building', delay: 6000 },
      { step: 'uncertainty', delay: 7500 },
    ]

    stepProgression.forEach(({ step, delay }) => {
      setTimeout(() => {
        setExecutionSteps(prev => 
          prev.map(s => s.step === step ? { ...s, status: 'completed' } : s)
        )
      }, delay)
    })
  }

  const handleRunQuery = async (queryText) => {
    console.log('🚀 handleRunQuery called with:', queryText)
    
    if (!queryText.trim()) {
      console.log('❌ Empty query, returning')
      return
    }

    console.log('🔄 Resetting state and starting query...')
    reset()
    setQuery(queryText)
    setLoading(true)
    setError(null)
    
    simulateExecutionSteps()

    try {
      console.log('📡 Calling API service...')
      const result = await apiService.runQuery(queryText)
      console.log('✅ API response received:', result)
      
      // Mark all steps as completed
      setExecutionSteps(prev => prev.map(step => ({ ...step, status: 'completed' })))
      
      setResponse(result)
      console.log('🎉 VARA Response set:', result)
    } catch (err) {
      console.error('❌ Query failed:', err)
      setError(err.message)
      
      // Mark steps as failed
      setExecutionSteps(prev => prev.map(step => ({ ...step, status: 'failed' })))
    } finally {
      setLoading(false)
      console.log('🏁 Query processing completed')
    }
  }

  const handleRetry = () => {
    if (query) {
      handleRunQuery(query)
    }
  }

  const handleClearError = () => {
    setError(null)
  }

  return (
    <div className="min-h-screen bg-vara-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Query Bar */}
        <QueryBar onSubmit={handleRunQuery} />

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto mb-6"
            >
              <div className="card" style={{
                backgroundColor: 'rgba(255, 71, 87, 0.1)',
                borderColor: 'rgba(255, 71, 87, 0.3)',
                padding: '16px'
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" style={{ color: '#ff4757' }} />
                    <div>
                      <p style={{ color: '#ff4757', fontWeight: 500 }}>Error</p>
                      <p style={{ color: '#a0a0b8', fontSize: '14px' }}>{error}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRetry}
                      style={{
                        backgroundColor: '#ff4757',
                        color: 'white',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                    <button
                      onClick={handleClearError}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '4px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <AlertCircle className="h-4 w-4" style={{ color: '#ff4757' }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {loading || response ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Execution Flow */}
              <ExecutionFlow />
              
              {/* Reasoning Panel */}
              <ReasoningPanel />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Graph Panel */}
              <GraphPanel />
              
              {/* Confidence Panel */}
              <ConfidencePanel />
            </div>
          </div>
        ) : (
          !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto mt-12 text-center"
            >
              <div className="card">
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e8e8e8', marginBottom: '16px' }}>
                  Welcome to VARA Intelligence Console
                </h2>
                <p style={{ color: '#a0a0b8', marginBottom: '32px', maxWidth: '512px', margin: '0 auto' }}>
                  Experience AI-powered reasoning with verification, uncertainty estimation, and knowledge graph visualization.
                  Ask any question and watch as VARA analyzes, verifies, and builds a comprehensive understanding.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card" style={{ backgroundColor: '#050508', padding: '16px' }}>
                    <div className="w-8 h-8" style={{
                      backgroundColor: 'rgba(0, 255, 136, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px'
                    }}>
                      <div className="w-4 h-4" style={{ backgroundColor: '#00ff88', borderRadius: '50%' }}></div>
                    </div>
                    <h3 style={{ fontWeight: 600, color: '#e8e8e8', marginBottom: '8px' }}>Intelligent Reasoning</h3>
                    <p style={{ fontSize: '14px', color: '#a0a0b8' }}>
                      Advanced AI reasoning with multi-step analysis and verification
                    </p>
                  </div>
                  
                  <div className="card" style={{ backgroundColor: '#050508', padding: '16px' }}>
                    <div className="w-8 h-8" style={{
                      backgroundColor: 'rgba(38, 222, 129, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px'
                    }}>
                      <div className="w-4 h-4" style={{ backgroundColor: '#26de81', borderRadius: '50%' }}></div>
                    </div>
                    <h3 style={{ fontWeight: 600, color: '#e8e8e8', marginBottom: '8px' }}>Uncertainty Awareness</h3>
                    <p style={{ fontSize: '14px', color: '#a0a0b8' }}>
                      Confidence scoring and uncertainty estimation for reliable insights
                    </p>
                  </div>
                  
                  <div className="card" style={{ backgroundColor: '#050508', padding: '16px' }}>
                    <div className="w-8 h-8" style={{
                      backgroundColor: 'rgba(72, 52, 212, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px'
                    }}>
                      <div className="w-4 h-4" style={{ backgroundColor: '#4834d4', borderRadius: '50%' }}></div>
                    </div>
                    <h3 style={{ fontWeight: 600, color: '#e8e8e8', marginBottom: '8px' }}>Knowledge Graph</h3>
                    <p style={{ fontSize: '14px', color: '#a0a0b8' }}>
                      Interactive visualization of claims and their relationships
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        )}

        {/* Claim Drawer */}
        <ClaimDrawer />
      </div>
    </div>
  )
}

export default Home
