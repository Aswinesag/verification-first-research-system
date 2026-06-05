import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Microscope,
  Search,
  Network,
  Database,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useHealth } from '@/hooks/useHealth'

const navigation = [
  { name: 'Research Workspace', href: '/', icon: Microscope },
  { name: 'Investigations', href: '/investigations', icon: Search },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Memory', href: '/memory', icon: Database },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const location = useLocation()
  const { health, loading, error } = useHealth()

  const backendStatus = error ? 'Offline' : loading ? 'Checking…' : health?.status === 'ok' ? 'Connected' : 'Degraded'
  const vectorStatus = health?.vector_db === 'loaded' ? 'Active' : 'Unloaded'
  const llmStatus = health?.llm === 'available' ? 'Ready' : 'Unavailable'

  const statusVariant = (label: string) => {
    if (label === 'Connected' || label === 'Active' || label === 'Ready') return 'success' as const
    if (label === 'Checking…' || label === 'Degraded' || label === 'Unloaded') return 'warning' as const
    return 'destructive' as const
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-surface transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        {!collapsed && (
          <div>
            <span className="text-lg font-semibold tracking-tight text-foreground">VARA</span>
            <p className="text-[10px] text-muted-foreground">Verified Autonomous Reasoning</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-2" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-surface-secondary hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        {!collapsed ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Backend</span>
              <Badge variant={statusVariant(backendStatus)} className="text-[10px]">
                {backendStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Vector Store</span>
              <Badge variant={statusVariant(vectorStatus)} className="text-[10px]">
                {vectorStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">LLM</span>
              <Badge variant={statusVariant(llmStatus)} className="text-[10px]">
                {llmStatus}
              </Badge>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'mx-auto h-2 w-2 rounded-full',
              error ? 'bg-danger' : health?.status === 'ok' ? 'bg-success' : 'bg-warning'
            )}
          />
        )}
      </div>
    </aside>
  )
}
