import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  Download,
  ExternalLink,
  ArrowUpDown,
} from 'lucide-react'
import { useHistoryStore } from '@/store'
import { useInvestigation } from '@/hooks/useInvestigation'
import { formatDateTime, formatPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Investigation } from '@/types/investigation'

type SortKey = 'date' | 'confidence' | 'claims'
type StatusFilter = 'all' | 'completed' | 'failed'

const Investigations: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { investigations, updateInvestigation, deleteInvestigation } = useHistoryStore()
  const { loadInvestigation } = useInvestigation()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams])
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const filtered = useMemo(() => {
    let result = [...investigations]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((inv) => inv.query.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter)
    }
    result.sort((a, b) => {
      if (sortBy === 'date') return b.timestamp - a.timestamp
      if (sortBy === 'confidence') return b.confidence - a.confidence
      return b.claimsCount - a.claimsCount
    })
    return result
  }, [investigations, search, sortBy, statusFilter])

  const openInvestigation = (inv: Investigation) => {
    loadInvestigation(inv)
    navigate('/')
  }

  const handleExport = (inv: Investigation) => {
    const blob = new Blob([JSON.stringify(inv, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `investigation-${inv.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRename = () => {
    if (renameId && renameValue.trim()) {
      updateInvestigation(renameId, { query: renameValue.trim() })
      setRenameId(null)
      setRenameValue('')
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Investigations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              History of research sessions and findings
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => navigate('/')}>
            <Plus className="h-4 w-4" />
            New Investigation
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search investigations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'completed', 'failed'] as StatusFilter[]).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                className="capitalize"
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('date')}>Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('confidence')}>Confidence</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('claims')}>Claims count</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-border bg-surface text-center">
            <p className="text-sm text-muted-foreground">
              {investigations.length === 0
                ? 'No investigations yet. Start one from the Research Workspace.'
                : 'No investigations match your filters.'}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/')}>
              Go to Workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/20"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openInvestigation(inv)}
                >
                  <p className="truncate font-medium text-foreground">{inv.query}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDateTime(inv.timestamp)}</span>
                    <span>{inv.claimsCount} claims</span>
                    {inv.status === 'completed' && (
                      <span>{formatPercentage(inv.confidence)} confidence</span>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'capitalize',
                      inv.status === 'completed' && 'border-success/30 text-success',
                      inv.status === 'failed' && 'border-danger/30 text-danger'
                    )}
                  >
                    {inv.status}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openInvestigation(inv)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameId(inv.id)
                          setRenameValue(inv.query)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(inv)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-danger"
                        onClick={() => deleteInvestigation(inv.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!renameId} onOpenChange={() => setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Investigation</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Investigations
