import React, { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHistoryStore } from '@/store'
import apiService from '@/services/api'
import { formatPercentage } from '@/lib/utils'
import { format } from 'date-fns'
import type { MetricsResponse } from '@/types/api'

const CHART_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6']

const Analytics: React.FC = () => {
  const { investigations } = useHistoryStore()
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [metricsError, setMetricsError] = useState(false)

  useEffect(() => {
    apiService
      .getMetrics()
      .then(setMetrics)
      .catch(() => setMetricsError(true))
  }, [])

  const completed = investigations.filter((i) => i.status === 'completed')
  const totalClaims = completed.reduce((sum, i) => sum + i.claimsCount, 0)
  const totalEvidence = completed.reduce(
    (sum, i) => sum + (i.response?.claims?.reduce((s, c) => s + c.sources.length, 0) || 0),
    0
  )
  const avgConfidence = completed.length
    ? completed.reduce((sum, i) => sum + i.confidence, 0) / completed.length
    : 0
  const verificationRate = completed.length
    ? completed.reduce((sum, inv) => {
        const claims = inv.response?.claims || []
        const verified = claims.filter(
          (c) => c.verification?.verification_status === 'verified'
        ).length
        return sum + (claims.length ? verified / claims.length : 0)
      }, 0) / completed.length
    : 0
  const graphSize = completed.reduce(
    (sum, i) => sum + (i.response?.graph?.nodes?.length || 0),
    0
  )

  const activityData = useMemo(() => {
    const byDay: Record<string, { date: string; investigations: number; claims: number }> = {}
    investigations.forEach((inv) => {
      const day = format(inv.timestamp, 'MMM d')
      if (!byDay[day]) byDay[day] = { date: day, investigations: 0, claims: 0 }
      byDay[day].investigations += 1
      byDay[day].claims += inv.claimsCount
    })
    return Object.values(byDay).slice(-14)
  }, [investigations])

  const confidenceTrend = useMemo(
    () =>
      completed
        .slice()
        .reverse()
        .map((inv, i) => ({
          index: i + 1,
          confidence: Math.round(inv.confidence * 100),
        })),
    [completed]
  )

  const claimsDistribution = useMemo(() => {
    const verified = completed.reduce(
      (sum, inv) =>
        sum +
        (inv.response?.claims?.filter(
          (c) => c.verification?.verification_status === 'verified'
        ).length || 0),
      0
    )
    const unsupported = completed.reduce(
      (sum, inv) =>
        sum +
        (inv.response?.claims?.filter(
          (c) => c.verification?.verification_status === 'unsupported'
        ).length || 0),
      0
    )
    const other = totalClaims - verified - unsupported
    return [
      { name: 'Verified', value: verified },
      { name: 'Unsupported', value: unsupported },
      { name: 'Other', value: Math.max(0, other) },
    ].filter((d) => d.value > 0)
  }, [completed, totalClaims])

  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    completed.forEach((inv) => {
      inv.response?.claims?.forEach((claim) => {
        claim.sources.forEach((src) => {
          counts[src.source] = (counts[src.source] || 0) + 1
        })
      })
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [completed])

  const metricCards = [
    { label: 'Investigations Run', value: String(investigations.length) },
    { label: 'Claims Generated', value: String(totalClaims) },
    { label: 'Evidence Retrieved', value: String(totalEvidence) },
    { label: 'Verification Rate', value: formatPercentage(verificationRate) },
    { label: 'Average Confidence', value: formatPercentage(avgConfidence) },
    { label: 'Graph Nodes', value: String(graphSize) },
    { label: 'Memory Entries', value: String(totalEvidence + totalClaims) },
    {
      label: 'System Health',
      value: metricsError ? 'N/A' : metrics ? 'Online' : 'Limited',
    },
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border p-6">
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational insights across investigations and system performance
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {metricCards.map((card) => (
            <Card key={card.label} className="border-border bg-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {metrics?.metrics && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="border-border bg-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  API Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.metrics.request_count}</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  LLM Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.metrics.llm_calls}</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Retrieval Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.metrics.retrieval_calls}</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Failure Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.metrics.failure_rate)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-base">Investigation Activity</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" tick={{ fill: '#a0a0b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#a0a0b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="investigations" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="claims" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No activity data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-base">Confidence Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {confidenceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={confidenceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="index" tick={{ fill: '#a0a0b8', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#a0a0b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No confidence data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-base">Claims Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {claimsDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={claimsDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {claimsDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No claims data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-base">Evidence Sources</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {sourceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis type="number" tick={{ fill: '#a0a0b8', fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fill: '#a0a0b8', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No evidence source data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Analytics
