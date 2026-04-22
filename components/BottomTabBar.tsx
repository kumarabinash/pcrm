'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, ClipboardList, Settings, type LucideIcon } from 'lucide-react'

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Today', icon: Home },
  { href: '/people', label: 'People', icon: Users },
  { href: '/log', label: 'Log', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomTabBar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/50 bg-background/80 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex justify-around">
        {TABS.map((tab) => {
          const active = isActive(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'flex flex-col items-center gap-0.5 py-2 px-4 text-[11px] transition-all duration-200',
                active
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground/50',
              ].join(' ')}
            >
              <div
                className={[
                  'flex items-center justify-center rounded-full transition-all duration-200',
                  active
                    ? 'bg-primary/15 px-4 py-1.5'
                    : 'px-4 py-1.5',
                ].join(' ')}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
              </div>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
