import type { Investigation, MemoryEntry } from '@/types/investigation'

export function buildMemoryFromInvestigations(investigations: Investigation[]): MemoryEntry[] {
  const entries: MemoryEntry[] = []

  investigations.forEach((inv) => {
    if (!inv.response?.claims) return
    inv.response.claims.forEach((claim) => {
      claim.sources.forEach((source, idx) => {
        entries.push({
          id: `${inv.id}-${claim.claim_id}-${idx}`,
          content: source.snippet || claim.text,
          source: source.source,
          confidence: claim.confidence,
          claimId: claim.claim_id,
          investigationId: inv.id,
          investigationQuery: inv.query,
          timestamp: inv.timestamp,
          relationships: inv.response?.graph?.edges
            .filter((e) => e.source === claim.claim_id || e.target === claim.claim_id)
            .map((e) => `${e.type}:${e.source === claim.claim_id ? e.target : e.source}`) || [],
        })
      })
      if (claim.sources.length === 0) {
        entries.push({
          id: `${inv.id}-${claim.claim_id}`,
          content: claim.text,
          source: 'claim',
          confidence: claim.confidence,
          claimId: claim.claim_id,
          investigationId: inv.id,
          investigationQuery: inv.query,
          timestamp: inv.timestamp,
          relationships: [],
        })
      }
    })
  })

  return entries.sort((a, b) => b.timestamp - a.timestamp)
}

export function getMemoryAge(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}
