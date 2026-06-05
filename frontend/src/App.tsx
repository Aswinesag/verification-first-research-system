import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Sidebar, Header } from './components/layout'
import { Loader2 } from 'lucide-react'

const Workspace = lazy(() => import('./pages/Workspace'))
const Investigations = lazy(() => import('./pages/Investigations'))
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'))
const Memory = lazy(() => import('./pages/Memory'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))

const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
)

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background">
        <Sidebar collapsed={false} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="min-h-0 flex-1 overflow-auto">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Workspace />} />
                <Route path="/investigations" element={<Investigations />} />
                <Route path="/graph" element={<KnowledgeGraph />} />
                <Route path="/memory" element={<Memory />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
