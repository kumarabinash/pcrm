'use client'

import { useState } from 'react'
import { BottomTabBar } from '@/components/BottomTabBar'
import { Fab } from '@/components/Fab'
import { NavigationProgress } from '@/components/NavigationProgress'
import { QuickLogSheet } from '@/components/QuickLogSheet'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background pb-20">
      <NavigationProgress />
      {children}
      <Fab onClick={() => setQuickLogOpen(true)} />
      <BottomTabBar />
      <QuickLogSheet open={quickLogOpen} onOpenChange={setQuickLogOpen} />
    </div>
  )
}
