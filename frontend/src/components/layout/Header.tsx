import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSettingsStore, useHistoryStore } from '@/store'
import { useInvestigation } from '@/hooks/useInvestigation'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const { investigations } = useHistoryStore()
  const { clearInvestigation } = useInvestigation()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/investigations?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleNewInvestigation = () => {
    clearInvestigation()
    navigate('/')
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex min-w-0 items-center gap-4">
        <h1 className="truncate text-lg font-semibold text-foreground">
          {settings.general.workspaceName}
        </h1>
        {investigations.length > 0 && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {investigations.length} investigation{investigations.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <form onSubmit={handleSearch} className="mx-4 hidden max-w-md flex-1 md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search investigations, claims..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <Button size="sm" className="gap-2" onClick={handleNewInvestigation}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Investigation</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/20 text-xs text-primary">
                  VA
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Analyst</p>
                <p className="text-xs text-muted-foreground">VARA Workspace</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/analytics')}>Analytics</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
