import React, { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Database, Network } from 'lucide-react'
import { useHistoryStore } from '@/store'
import { buildMemoryFromInvestigations, getMemoryAge } from '@/lib/memory'
import { formatPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'

const Memory: React.FC = () => {
  const { investigations } = useHistoryStore()
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [confidenceFilter, setConfidenceFilter] = useState('all')

  const memoryEntries = useMemo(
    () => buildMemoryFromInvestigations(investigations),
    [investigations]
  )

  const sourceTypes = useMemo(() => {
    const types = new Set(memoryEntries.map((m) => m.source))
    return Array.from(types)
  }, [memoryEntries])

  const filtered = useMemo(() => {
    let result = memoryEntries
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.investigationQuery.toLowerCase().includes(q) ||
          m.source.toLowerCase().includes(q)
      )
    }
    if (sourceFilter !== 'all') {
      result = result.filter((m) => m.source === sourceFilter)
    }
    if (confidenceFilter === 'high') {
      result = result.filter((m) => m.confidence >= 0.75)
    } else if (confidenceFilter === 'medium') {
      result = result.filter((m) => m.confidence >= 0.4 && m.confidence < 0.75)
    } else if (confidenceFilter === 'low') {
      result = result.filter((m) => m.confidence < 0.4)
    }
    return result
  }, [memoryEntries, search, sourceFilter, confidenceFilter])

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Memory Explorer</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Persistent knowledge accumulated across investigations
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>{memoryEntries.length} entries</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search memory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sourceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All confidence</SelectItem>
              <SelectItem value="high">High (≥75%)</SelectItem>
              <SelectItem value="medium">Medium (40–74%)</SelectItem>
              <SelectItem value="low">Low (&lt;40%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-border bg-surface text-center">
            <Database className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {memoryEntries.length === 0
                ? 'Memory builds as you complete investigations. Run your first investigation to populate memory.'
                : 'No memory entries match your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/20"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs">
                    {entry.source}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getMemoryAge(entry.timestamp)}
                  </span>
                </div>

                <p className="mb-3 text-sm text-foreground line-clamp-3">{entry.content}</p>

                <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      'font-medium',
                      entry.confidence >= 0.75 && 'text-success',
                      entry.confidence >= 0.4 && entry.confidence < 0.75 && 'text-warning',
                      entry.confidence < 0.4 && 'text-danger'
                    )}
                  >
                    {formatPercentage(entry.confidence)} confidence
                  </span>
                  {entry.relationships.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Network className="h-3 w-3" />
                      {entry.relationships.length} links
                    </span>
                  )}
                </div>

                <p className="truncate text-xs text-muted-foreground">
                  From: {entry.investigationQuery}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Memory
