import React, { useMemo, useState } from 'react'
import { useInvestigationStore } from '@/store'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, FileText, Filter } from 'lucide-react'
import { formatPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Source } from '@/types/api'

interface EvidenceItem extends Source {
  claimId: string
  claimText: string
}

export const EvidenceExplorer: React.FC = () => {
  const { response, selectedClaim, setSelectedClaim } = useInvestigationStore()
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'source'>('relevance')

  const evidence = useMemo(() => {
    const items: EvidenceItem[] = []
    const claims = response?.claims || []
    const filteredClaims = selectedClaim
      ? claims.filter((c) => c.claim_id === selectedClaim)
      : claims

    filteredClaims.forEach((claim) => {
      claim.sources.forEach((source) => {
        items.push({
          ...source,
          claimId: claim.claim_id,
          claimText: claim.text,
        })
      })
    })
    return items
  }, [response, selectedClaim])

  const sourceTypes = useMemo(() => {
    const types = new Set(evidence.map((e) => e.source))
    return Array.from(types)
  }, [evidence])

  const filtered = useMemo(() => {
    let result = evidence
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.snippet.toLowerCase().includes(q) ||
          e.claimText.toLowerCase().includes(q) ||
          e.source.toLowerCase().includes(q)
      )
    }
    if (sourceFilter !== 'all') {
      result = result.filter((e) => e.source === sourceFilter)
    }
    if (sortBy === 'relevance') {
      result = [...result].sort((a, b) => b.score - a.score)
    } else {
      result = [...result].sort((a, b) => a.source.localeCompare(b.source))
    }
    return result
  }, [evidence, search, sourceFilter, sortBy])

  const getQualityLabel = (score: number) => {
    if (score >= 0.75) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  return (
    <div className="flex h-full flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium text-foreground">Evidence Explorer</h4>
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} items</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter evidence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <Filter className="mr-1 h-3 w-3" />
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
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'relevance' | 'source')}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="source">Source</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            {response ? 'No evidence matches your filters' : 'Run an investigation to explore evidence'}
          </div>
        ) : (
          filtered.map((item, i) => (
            <button
              key={`${item.claimId}-${item.source_id}-${i}`}
              type="button"
              onClick={() => setSelectedClaim(item.claimId)}
              className={cn(
                'w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/30',
                selectedClaim === item.claimId && 'border-primary/50 bg-primary/5'
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {item.source}
                </Badge>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      'text-[10px]',
                      getQualityLabel(item.score) === 'high' && 'bg-success/20 text-success',
                      getQualityLabel(item.score) === 'medium' && 'bg-warning/20 text-warning',
                      getQualityLabel(item.score) === 'low' && 'bg-danger/20 text-danger'
                    )}
                  >
                    {getQualityLabel(item.score)} quality
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatPercentage(item.score)}
                  </span>
                </div>
              </div>
              <p className="mb-2 text-sm text-foreground line-clamp-2">{item.snippet}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Claim: {item.claimText}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
