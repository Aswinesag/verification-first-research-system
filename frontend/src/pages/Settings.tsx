import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettingsStore } from '@/store'

const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettingsStore()

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure reasoning, retrieval, verification, and appearance
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={resetSettings}>
            Reset to defaults
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="general" className="w-full max-w-4xl">
          <TabsList className="mb-6 grid w-full grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="retrieval">Retrieval</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input
                    value={settings.general.workspaceName}
                    onChange={(e) =>
                      updateSettings('general', { workspaceName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(v) => updateSettings('general', { language: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.appearance.theme}
                    onValueChange={(v: 'dark' | 'light') =>
                      updateSettings('appearance', { theme: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={settings.appearance.accentColor}
                      onChange={(e) =>
                        updateSettings('appearance', { accentColor: e.target.value })
                      }
                      className="h-10 w-16 cursor-pointer p-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.appearance.accentColor}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reasoning">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>Reasoning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Debate Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable multi-agent debate for complex reasoning
                    </p>
                  </div>
                  <Switch
                    checked={settings.reasoning.debateMode}
                    onCheckedChange={(v) => updateSettings('reasoning', { debateMode: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confidence Threshold</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.reasoning.confidenceThreshold}
                    onChange={(e) =>
                      updateSettings('reasoning', {
                        confidenceThreshold: parseFloat(e.target.value) || 0.5,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Verification Strictness</Label>
                  <Select
                    value={settings.verification.verificationStrictness}
                    onValueChange={(v: 'strict' | 'moderate' | 'lenient') =>
                      updateSettings('verification', { verificationStrictness: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="lenient">Lenient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto Verify</Label>
                  <Switch
                    checked={settings.verification.autoVerify}
                    onCheckedChange={(v) =>
                      updateSettings('verification', { autoVerify: v })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retrieval">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>Retrieval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Web Search</Label>
                  <Switch
                    checked={settings.retrieval.webSearchEnabled}
                    onCheckedChange={(v) =>
                      updateSettings('retrieval', { webSearchEnabled: v })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Dataset Search</Label>
                  <Switch
                    checked={settings.retrieval.datasetSearchEnabled}
                    onCheckedChange={(v) =>
                      updateSettings('retrieval', { datasetSearchEnabled: v })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Local Memory</Label>
                  <Switch
                    checked={settings.retrieval.localMemoryEnabled}
                    onCheckedChange={(v) =>
                      updateSettings('retrieval', { localMemoryEnabled: v })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memory">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>Memory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Memory is built from completed investigations and stored locally. Entries
                  appear in the Memory Explorer as evidence and claims accumulate.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Local Memory Retrieval</Label>
                    <p className="text-xs text-muted-foreground">
                      Use stored memory during investigations
                    </p>
                  </div>
                  <Switch
                    checked={settings.retrieval.localMemoryEnabled}
                    onCheckedChange={(v) =>
                      updateSettings('retrieval', { localMemoryEnabled: v })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle>Advanced</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Cache Enabled</Label>
                  <Switch
                    checked={settings.advanced.cacheEnabled}
                    onCheckedChange={(v) => updateSettings('advanced', { cacheEnabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Debug Mode</Label>
                  <Switch
                    checked={settings.advanced.debugMode}
                    onCheckedChange={(v) => updateSettings('advanced', { debugMode: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={settings.advanced.maxRetries}
                    onChange={(e) =>
                      updateSettings('advanced', {
                        maxRetries: parseInt(e.target.value, 10) || 3,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Settings
