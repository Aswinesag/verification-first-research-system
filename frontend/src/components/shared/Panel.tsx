import React from 'react'
import { cn } from '@/lib/utils'

interface PanelProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
  noPadding,
}) => (
  <div className={cn('flex flex-col rounded-xl border border-border bg-surface', className)}>
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className={cn('min-h-0 flex-1 overflow-hidden', !noPadding && 'p-4')}>{children}</div>
  </div>
)
