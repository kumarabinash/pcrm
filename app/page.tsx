export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import SettingsButton from '@/components/SettingsButton'
import { Boxes } from 'lucide-react'

export default async function HomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <Boxes className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-display text-lg text-foreground">Boilerplate</span>
          <div className="flex-1" />
          <SettingsButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-display text-foreground">
          Welcome, {session.user.name ?? 'there'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your boilerplate is ready. Start building your app from here.
        </p>
      </main>
    </div>
  )
}
