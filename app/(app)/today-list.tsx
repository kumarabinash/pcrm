'use client'

import Link from 'next/link'
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'

interface ReminderRow {
  reminder: {
    id: string
    dueDate: Date
    title: string | null
    type: string
    time: string | null
  }
  contactName: string
  contactId: string
}

interface TodayListProps {
  overdue: ReminderRow[]
  dueToday: ReminderRow[]
  thisWeek: ReminderRow[]
}

function priorityDot(type: 'overdue' | 'today' | 'week') {
  const colors = { overdue: 'bg-red-500', today: 'bg-amber-500', week: 'bg-green-500' }
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[type]} shrink-0`} />
}

function ReminderRow({ item, priority }: { item: ReminderRow; priority: 'overdue' | 'today' | 'week' }) {
  const contextLine =
    priority === 'overdue'
      ? `${formatDistanceToNow(item.reminder.dueDate)} overdue`
      : item.reminder.time
        ? `${item.reminder.title ?? (item.reminder.type === 'recurring' ? 'Check in' : 'Reminder')} at ${item.reminder.time}`
        : item.reminder.title ?? (item.reminder.type === 'recurring' ? 'Check in' : 'Reminder')

  return (
    <Link
      href={`/people/${item.contactId}`}
      className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 active:bg-muted/30 transition-colors"
    >
      {priorityDot(priority)}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate">{item.contactName}</p>
        <p className="text-[13px] text-muted-foreground truncate">{contextLine}</p>
      </div>
    </Link>
  )
}

export function TodayList({ overdue, dueToday, thisWeek }: TodayListProps) {
  const router = useRouter()
  const isEmpty = overdue.length === 0 && dueToday.length === 0 && thisWeek.length === 0

  return (
    <PullToRefreshWrapper onRefresh={() => router.refresh()}>
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
