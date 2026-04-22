'use client'

import { format, isPast, isToday } from 'date-fns'

interface ReminderItemProps {
  id: string
  title: string | null
  type: string
  dueDate: Date
  frequencyDays: number | null
  time: string | null
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ReminderItem({ id, title, type, dueDate, frequencyDays, time, onComplete, onDelete }: ReminderItemProps) {
  const overdue = isPast(dueDate) && !isToday(dueDate)
  const today = isToday(dueDate)

  const statusLabel = overdue ? 'overdue' : today ? 'today' : 'upcoming'
  const statusColor = overdue
    ? 'bg-red-500/10 text-red-500'
    : today
      ? 'bg-amber-500/10 text-amber-500'
      : 'bg-green-500/10 text-green-500'

  const description =
    type === 'recurring' && frequencyDays
      ? `Every ${frequencyDays} days · next due ${format(dueDate, 'MMM d')}`
      : `${format(dueDate, 'MMM d')}${time ? ` at ${time}` : ''} · one-off`

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium">{title ?? (type === 'recurring' ? 'Check in' : 'Reminder')}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
        {statusLabel}
      </span>
    </div>
  )
}
