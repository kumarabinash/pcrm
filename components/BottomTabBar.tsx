'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const TABS = [
  { href: '/', label: 'Today', icon: '🏠' },
  { href: '/people', label: 'People', icon: '👥' },
  { href: '/log', label: 'Log', icon: '📋' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
] as const

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
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'flex flex-col items-center gap-0.5 py-2 px-4 text-[11px] transition-colors',
                active
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground/50',
              ].join(' ')}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
