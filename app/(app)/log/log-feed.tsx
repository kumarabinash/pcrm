'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'
import { interactionIcon } from '@/components/InteractionTypePicker'
import { moodEmoji } from '@/components/MoodPicker'
import { format, isToday, isYesterday } from 'date-fns'

interface LogItem {
  interaction: {
    id: string
    type: string
    note: string | null
    details: string | null
    mood: string | null
    date: Date
    topics: string[] | null
    contactId: string
  }
  contactName: string
}

function dateLabel(date: Date) {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMM d')
}

export function LogFeed({ items }: { items: LogItem[] }) {
  const router = useRouter()

  const grouped = items.reduce<Record<string, LogItem[]>>((acc, item) => {
    const key = format(item.interaction.date, 'yyyy-MM-dd')
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const dateKeys = Object.keys(grouped).sort().reverse()

  return (
    <PullToRefreshWrapper onRefresh={() => router.refresh()}>
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="text-[22px] font-bold text-foreground">Log</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-muted-foreground text-sm">No interactions logged yet</p>
          </div>
        ) : (
          dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <div className="sticky top-[56px] z-10 bg-background/90 backdrop-blur-sm px-4 py-1.5">
                <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase">
                  {dateLabel(new Date(dateKey + 'T12:00:00'))}
                </span>
              </div>
              {grouped[dateKey].map((item) => (
                <Link key={item.interaction.id} href={`/people/${item.interaction.contactId}`} className="flex items-start gap-3 px-4 py-3 border-b border-border/30 active:bg-muted/30 transition-colors">
                  <span className="text-sm mt-0.5">{interactionIcon(item.interaction.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{item.contactName}</span>
                      <span className="text-[12px] text-muted-foreground capitalize">{item.interaction.type.replace('-', ' ')}</span>
                    </div>
                    {item.interaction.note && (
                      <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{item.interaction.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground/50">{format(item.interaction.date, 'h:mm a')}</span>
                      {item.interaction.mood && <span className="text-[11px]">{moodEmoji(item.interaction.mood)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))
        )}
      </main>
    </PullToRefreshWrapper>
  )
}
