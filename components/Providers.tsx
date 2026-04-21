'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { OneSignalInit } from '@/components/OneSignalInit'
import { NotificationPrompt } from '@/components/NotificationPrompt'
import { SplashScreen } from '@/components/SplashScreen'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SplashScreen />
      <OneSignalInit />
      <NotificationPrompt />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          {children}
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
