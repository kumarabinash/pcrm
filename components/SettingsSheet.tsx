'use client'

import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { NotificationPreferences } from '@/components/NotificationPreferences'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const THEMES = [
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
] as const

export default function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  const user = session?.user
  const initial = (user?.name ?? user?.email ?? '?')[0].toUpperCase()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl bg-card border-border/60 focus-visible:outline-none"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base font-semibold">Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-2" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>

          {/* ── Account ── */}
          <section className="space-y-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground/55 uppercase tracking-widest px-0.5">
              Account
            </p>
            <div className="flex items-center gap-3 bg-muted/40 border border-border/40 rounded-xl px-4 py-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-sm font-semibold bg-primary/15 text-primary border border-primary/20">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {user?.name && (
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">{user.name}</p>
                )}
                <p className={`text-xs text-muted-foreground truncate ${user?.name ? 'mt-0.5' : ''}`}>
                  {user?.email}
                </p>
              </div>
            </div>
          </section>

          {/* ── Appearance ── */}
          <section className="space-y-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground/55 uppercase tracking-widest px-0.5">
              Appearance
            </p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(({ value, label, Icon }) => {
                const active = theme === value
                return (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={[
                      'flex flex-col items-center gap-2.5 py-3.5 px-2 rounded-xl border text-xs font-medium',
                      'transition-all duration-150 active:scale-95',
                      active
                        ? 'bg-primary/12 border-primary/35 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
                        : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    ].join(' ')}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Notifications ── */}
          <section className="space-y-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground/55 uppercase tracking-widest px-0.5">
              Notifications
            </p>
            <NotificationPreferences />
          </section>

          {/* ── Danger zone ── */}
          <section>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={[
                'w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium',
                'bg-muted/40 border border-border/40 text-muted-foreground',
                'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/25',
                'transition-all duration-150 active:scale-[0.98]',
              ].join(' ')}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
