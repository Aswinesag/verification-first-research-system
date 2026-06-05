import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, X, Lightbulb, Clock, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHistoryStore } from '@/store'

const templates = [
  { id: 'research', name: 'Research Analysis', prefix: 'Analyze ' },
  { id: 'risk', name: 'Risk Assessment', prefix: 'Evaluate risks of ' },
  { id: 'tech', name: 'Technology Evaluation', prefix: 'Compare and evaluate ' },
  { id: 'literature', name: 'Literature Review', prefix: 'Review recent research on ' },
  { id: 'competitive', name: 'Competitive Analysis', prefix: 'Compare ' },
]

const exampleQueries = [
  'Analyze AI adoption in healthcare',
  'Compare vector databases for production RAG',
  'Evaluate RAG architectures for enterprise search',
  'Assess cybersecurity risks in cloud migration',
  'Review evidence on LLM reasoning capabilities',
]

interface QueryComposerProps {
  onSubmit: (query: string, template?: string) => void
  loading?: boolean
}

export const QueryComposer: React.FC<QueryComposerProps> = ({ onSubmit, loading = false }) => {
  const [query, setQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(false)
  const { investigations } = useHistoryStore()
  const recent = investigations.slice(0, 5)

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmit(query, selectedTemplate || undefined)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setQuery(template.prefix)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <Badge
            key={template.id}
            variant={selectedTemplate === template.id ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === template.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <Bookmark className="mr-1 h-3 w-3" />
            {template.name}
          </Badge>
        ))}
      </div>

      <Textarea
        placeholder="What would you like VARA to investigate?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[88px] resize-none text-base"
        disabled={loading}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExamples(!showExamples)}
          className="h-8 px-2 text-primary"
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          {showExamples ? 'Hide' : 'Show'} examples
        </Button>

        {recent.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {recent.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => setQuery(inv.query)}
                className="max-w-[200px] truncate rounded-md bg-surface-secondary px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {inv.query}
              </button>
            ))}
          </div>
        )}
      </div>

      {showExamples && (
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example)
                setShowExamples(false)
              }}
              className="rounded-lg bg-surface-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={!query.trim() || loading} className="min-w-[200px]">
          {loading ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Running Investigation...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run Investigation
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setQuery('')
            setSelectedTemplate(null)
          }}
          disabled={loading}
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <span className="text-xs text-muted-foreground">Ctrl+Enter to run</span>
      </div>
    </div>
  )
}
