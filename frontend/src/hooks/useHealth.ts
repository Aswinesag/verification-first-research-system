import { useEffect, useState } from 'react'
import apiService from '@/services/api'
import type { HealthResponse } from '@/types/api'

export function useHealth(pollIntervalMs = 30000) {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchHealth = async () => {
      try {
        const data = await apiService.getHealth()
        if (mounted) {
          setHealth(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Health check failed')
          setHealth(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, pollIntervalMs)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [pollIntervalMs])

  return { health, loading, error }
}
