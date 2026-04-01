import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react'
import { useStore } from '../store/useStore'

const ExecutionFlow = () => {
  const { executionSteps } = useStore()
  const normalizedExecutionSteps = Array.isArray(executionSteps) ? executionSteps : []

  const steps = [
    { id: 'planning', name: 'Planning', description: 'Analyzing query and creating execution plan' },
    { id: 'retrieval', name: 'Information Retrieval', description: 'Gathering relevant data and sources' },
    { id: 'execution', name: 'Claim Generation', description: 'Generating and verifying claims' },
    { id: 'verification', name: 'Verification', description: 'Cross-checking claims with evidence' },
    { id: 'graph_building', name: 'Knowledge Graph', description: 'Building relationships and detecting conflicts' },
    { id: 'uncertainty', name: 'Uncertainty Analysis', description: 'Calculating confidence and trust levels' },
  ]

  const getStepStatus = (stepId) => {
    const step = normalizedExecutionSteps.find(s => s.step === stepId)
    if (!step) return 'pending'
    if (step.status === 'completed') return 'completed'
    if (step.status === 'failed') return 'failed'
    return 'in_progress'
  }

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-vara-success" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-vara-danger" />
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-vara-accent animate-spin" />
      default:
        return <Circle className="h-5 w-5 text-vara-text-secondary" />
    }
  }

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-vara-success'
      case 'failed':
        return 'text-vara-danger'
      case 'in_progress':
        return 'text-vara-accent'
      default:
        return 'text-vara-text-secondary'
    }
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e8e8e8', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="w-3 h-3" style={{ backgroundColor: '#00ff88', borderRadius: '50%' }}></div>
        Execution Pipeline
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          const color = getStepColor(status)
          
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flexShrink: 0, marginTop: '4px' }}>
                {getStepIcon(status)}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ fontWeight: 500, color: '#e8e8e8' }}>{step.name}</h4>
                  {status === 'in_progress' && (
                    <div style={{ fontSize: '12px', color: '#00ff88' }}>
                      Processing...
                    </div>
                  )}
                </div>
                
                <p style={{ fontSize: '14px', color: '#a0a0b8' }}>{step.description}</p>
                
                {status === 'completed' && (
                  <div style={{ marginTop: '8px', height: '4px', backgroundColor: '#26de81', borderRadius: '4px' }}></div>
                )}
                
                {status === 'failed' && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff4757' }}>
                    Step failed - check logs for details
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ExecutionFlow
