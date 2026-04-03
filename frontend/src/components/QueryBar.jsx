import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Send, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'

const QueryBar = ({ onSubmit }) => {
  const { query, setError, loading } = useStore()
  const [localQuery, setLocalQuery] = useState(query)

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('🔍 QueryBar handleSubmit called with:', localQuery)
    
    if (!localQuery.trim()) {
      console.log('❌ Empty query in QueryBar')
      setError('Please enter a query')
      return
    }

    console.log('📤 QueryBar calling onSubmit with:', localQuery)
    if (onSubmit) {
      onSubmit(localQuery)
    } else {
      console.log('❌ onSubmit prop is missing in QueryBar')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="query-shell"
    >
      <div className="query-card">
        <div className="query-head">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-vara-accent rounded-full animate-pulse-slow" />
            <h1 className="query-title">VARA Intelligence Console</h1>
          </div>
          <p className="query-subtitle">
            Verification-first research workspace with confidence tracking and graph reasoning.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="query-form">
          <div className="query-input-wrap">
            <div className="query-input-icon">
              <Search className="h-5 w-5 text-vara-text-secondary" />
            </div>
            <textarea
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask VARA to research, analyze, and reason about any topic..."
              className="input-primary"
              rows={3}
              disabled={loading}
            />
          </div>
          
          <div className="query-footer">
            <div className="query-meta">
              <div className="w-2 h-2 bg-vara-success rounded-full"></div>
              <span>AI-powered reasoning and verification</span>
            </div>
            
            <button
              type="submit"
              disabled={loading || !localQuery.trim()}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Run Query
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default QueryBar
