'use client'

import Link from 'next/link'
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNowStrict } from 'date-fns'

interface ReminderRow {
  reminder: {
    id: string
    dueDate: Date
    title: string | null
    type: string
    time: string | null
    frequencyDays: number | null
  }
  contactName: string
  contactId: string
}

interface TodayListProps {
  overdue: ReminderRow[]
  dueToday: ReminderRow[]
  thisWeek: ReminderRow[]
}

function StatusPill({ priority, dueDate }: { priority: 'overdue' | 'today' | 'week'; dueDate: Date }) {
  const config = {
    overdue: { bg: 'bg-red-500/15', text: 'text-red-500', label: `${formatDistanceToNowStrict(dueDate)} overdue` },
    today: { bg: 'bg-amber-500/15', text: 'text-amber-500', label: 'today' },
    week: { bg: 'bg-green-500/15', text: 'text-green-500', label: format(dueDate, 'EEE') },
  }
  const c = config[priority]
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.bg} ${c.text} shrink-0`}>
      {c.label}
    </span>
  )
}

function PriorityCircle({ priority }: { priority: 'overdue' | 'today' | 'week' }) {
  const colors = { overdue: 'border-red-500', today: 'border-amber-500', week: 'border-green-500' }
  return <div className={`w-[22px] h-[22px] rounded-full border-2 ${colors[priority]} shrink-0`} />
}

function ReminderRow({ item, priority }: { item: ReminderRow; priority: 'overdue' | 'today' | 'week' }) {
  const titleText = item.reminder.title
    ?? (item.reminder.type === 'recurring' ? 'Check in' : 'Reminder')
  const titleWithTime = item.reminder.time
    ? `${titleText} at ${item.reminder.time}`
    : titleText

  const metaParts: string[] = []
  if (item.reminder.type === 'recurring' && item.reminder.frequencyDays) {
    metaParts.push(`🔁 Every ${item.reminder.frequencyDays}d`)
  }
  if (priority !== 'today') {
    metaParts.push(`📅 ${format(item.reminder.dueDate, 'MMM d')}`)
  }
  if (item.reminder.type === 'one-off') {
    metaParts.push('One-off')
  }

  return (
    <Link
      href={`/people/${item.contactId}`}
      className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 active:bg-muted/30 transition-colors"
    >
      <PriorityCircle priority={priority} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-semibold text-foreground truncate">{item.contactName}</p>
          <StatusPill priority={priority} dueDate={item.reminder.dueDate} />
        </div>
        <p className="text-[13px] text-muted-foreground/80 mt-0.5 truncate">{titleWithTime}</p>
        {metaParts.length > 0 && (
          <p className="text-[12px] text-muted-foreground/60 mt-0.5 truncate">
            {metaParts.join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}

export function TodayList({ overdue, dueToday, thisWeek }: TodayListProps) {
  const router = useRouter()
  const isEmpty = overdue.length === 0 && dueToday.length === 0 && thisWeek.length === 0

  return (
    <PullToRefreshWrapper onRefresh={async () => { router.refresh() }}>
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="text-[22px] font-bold text-foreground">Today</h1>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMM d')}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {isEmpty ? (
          <div className="py-24 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-muted-foreground text-sm">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {overdue.map((item) => (
              <ReminderRow key={item.reminder.id} item={item} priority="overdue" />
            ))}
            {dueToday.map((item) => (
              <ReminderRow key={item.reminder.id} item={item} priority="today" />
            ))}
            {thisWeek.map((item) => (
              <ReminderRow key={item.reminder.id} item={item} priority="week" />
            ))}
          </div>
        )}
      </main>
    </PullToRefreshWrapper>
  )
}
