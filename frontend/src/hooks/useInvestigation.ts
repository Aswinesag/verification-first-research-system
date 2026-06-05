import { useCallback, useRef } from 'react'
import { useInvestigationStore, useHistoryStore, useGraphStore } from '@/store'
import apiService from '@/services/api'
import {
  createInitialSteps,
  simulateInvestigationProgress,
  buildActivitiesFromResponse,
  completeAllSteps,
} from '@/lib/investigationRunner'
import type { Investigation } from '@/types/investigation'

export function useInvestigation() {
  const {
    setQuery,
    setLoading,
    setError,
    setResponse,
    setExecutionSteps,
    addAgentActivity,
    reset,
  } = useInvestigationStore()
  const { addInvestigation } = useHistoryStore()
  const { setGraphData } = useGraphStore()
  const cancelRef = useRef({ cancelled: false })

  const runInvestigation = useCallback(
    async (queryText: string) => {
      cancelRef.current = { cancelled: false }
      const signal = cancelRef.current

      setQuery(queryText)
      setLoading(true)
      setError(null)
      setResponse(null)
      setExecutionSteps(createInitialSteps())

      addAgentActivity({
        agent: 'Planner',
        message: `Launching investigation: "${queryText.slice(0, 60)}${queryText.length > 60 ? '…' : ''}"`,
        timestamp: Date.now(),
        status: 'success',
      })

      const progressPromise = simulateInvestigationProgress(
        setExecutionSteps,
        addAgentActivity,
        signal
      )

      try {
        const [response] = await Promise.all([
          apiService.runQuery(queryText),
          progressPromise,
        ])

        if (signal.cancelled) return

        setResponse(response)
        setGraphData(response.graph)
        setExecutionSteps(completeAllSteps())

        const resultActivities = buildActivitiesFromResponse(queryText, response)
        resultActivities.forEach(addAgentActivity)

        const investigation: Investigation = {
          id: crypto.randomUUID(),
          query: queryText,
          timestamp: Date.now(),
          status: 'completed',
          confidence: response.overall_confidence,
          claimsCount: response.claims.length,
          response,
        }
        addInvestigation(investigation)
      } catch (error) {
        if (signal.cancelled) return
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        setError(errorMessage)
        setExecutionSteps((prev) =>
          prev.map((s) =>
            s.status === 'in_progress' ? { ...s, status: 'failed' } : s
          )
        )
        addAgentActivity({
          agent: 'Planner',
          message: `Investigation failed: ${errorMessage}`,
          timestamp: Date.now(),
          status: 'error',
        })

        addInvestigation({
          id: crypto.randomUUID(),
          query: queryText,
          timestamp: Date.now(),
          status: 'failed',
          confidence: 0,
          claimsCount: 0,
          response: null,
        })
      } finally {
        setLoading(false)
      }
    },
    [
      setQuery,
      setLoading,
      setError,
      setResponse,
      setExecutionSteps,
      addAgentActivity,
      setGraphData,
      addInvestigation,
    ]
  )

  const loadInvestigation = useCallback(
    (investigation: Investigation) => {
      setQuery(investigation.query)
      setError(null)
      setLoading(false)
      if (investigation.response) {
        setResponse(investigation.response)
        setGraphData(investigation.response.graph)
        setExecutionSteps(completeAllSteps())
      } else {
        setResponse(null)
        setExecutionSteps([])
      }
    },
    [setQuery, setError, setLoading, setResponse, setGraphData, setExecutionSteps]
  )

  const clearInvestigation = useCallback(() => {
    cancelRef.current.cancelled = true
    reset()
  }, [reset])

  return { runInvestigation, loadInvestigation, clearInvestigation }
}
