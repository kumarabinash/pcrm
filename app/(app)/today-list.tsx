'use client'

import { useState, useRef } from 'react'
// Navigation handled programmatically via router.push to avoid Safari's
// native link-preview on long-press, which conflicts with our gesture handling.
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { completeReminder, undoReminderAction, snoozeReminder, skipReminder, deleteReminder } from '@/app/actions/reminders'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Calendar } from '@/components/ui/calendar'

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
    <div
      className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 active:bg-muted/30 transition-colors cursor-pointer"
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
    </div>
  )
}

function SwipeableRow({
  children,
  onSwipeComplete,
  onLongPress,
  onTap,
}: {
  children: React.ReactNode
  onSwipeComplete: () => void
  onLongPress: () => void
  onTap: () => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const isTracking = useRef(false)
  const directionDecided = useRef(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  const THRESHOLD = 100

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    currentX.current = 0
    isTracking.current = false
    directionDecided.current = false
    longPressFired.current = false

    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      onLongPress()
    }, 500)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaX = e.touches[0].clientX - startX.current
    const deltaY = e.touches[0].clientY - startY.current

    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      clearLongPress()
    }

    if (longPressFired.current) return

    if (!directionDecided.current) {
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return
      directionDecided.current = true
      isTracking.current = Math.abs(deltaX) > Math.abs(deltaY)
    }

    if (!isTracking.current) return

    const clampedX = Math.max(0, deltaX)
    currentX.current = clampedX
    if (rowRef.current) {
      rowRef.current.style.transform = `translateX(${clampedX}px)`
    }
  }

  function handleTouchEnd() {
    clearLongPress()

    if (longPressFired.current) return

    if (!isTracking.current) {
      // No swipe detected — this was a clean tap
      if (!directionDecided.current) onTap()
      return
    }

    if (currentX.current >= THRESHOLD) {
      if (rowRef.current) {
        rowRef.current.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out'
        rowRef.current.style.transform = 'translateX(100%)'
        rowRef.current.style.opacity = '0'
      }
      setTimeout(onSwipeComplete, 200)
    } else {
      if (rowRef.current) {
        rowRef.current.style.transition = 'transform 200ms ease-out'
        rowRef.current.style.transform = 'translateX(0)'
        setTimeout(() => {
          if (rowRef.current) rowRef.current.style.transition = ''
        }, 200)
      }
    }

    isTracking.current = false
    directionDecided.current = false
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-green-500 flex items-center pl-4">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div
        ref={rowRef}
        className="relative bg-background"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

function ReminderActionSheet({
  item,
  open,
  onOpenChange,
  onComplete,
}: {
  item: ReminderRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (item: ReminderRow) => void
}) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!item) return null

  const titleText = item.reminder.title
    ?? (item.reminder.type === 'recurring' ? 'Check in' : 'Reminder')

  function close() {
    onOpenChange(false)
    setShowSnoozeOptions(false)
    setShowDatePicker(false)
    setShowDeleteConfirm(false)
  }

  async function handleSnooze(date: Date) {
    try {
      const result = await snoozeReminder(item!.reminder.id, date)
      close()
      toast(`Snoozed until ${format(date, 'MMM d')}`, {
        action: {
          label: 'Undo',
          onClick: () => undoReminderAction(item!.reminder.id, result.previousDueDate, false),
        },
        duration: 5000,
      })
    } catch {
      toast.error('Failed to snooze reminder')
    }
  }

  async function handleSkip() {
    try {
      const result = await skipReminder(item!.reminder.id)
      close()
      toast(`Skipped — next in ${result.frequencyDays} days`, {
        action: {
          label: 'Undo',
          onClick: () => undoReminderAction(item!.reminder.id, result.previousDueDate, false),
        },
        duration: 5000,
      })
    } catch {
      toast.error('Failed to skip reminder')
    }
  }

  async function handleDelete() {
    try {
      await deleteReminder(item!.reminder.id)
      close()
      toast('Reminder deleted')
    } catch {
      toast.error('Failed to delete reminder')
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const in3Days = new Date()
  in3Days.setDate(in3Days.getDate() + 3)

  const actionButtonClass = 'w-full text-left px-4 py-3.5 text-[15px] border-b border-border/30 active:bg-muted/30 transition-colors'

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) close(); else onOpenChange(v) }}>
        <SheetContent side="bottom" className="pb-safe">
          <SheetHeader className="text-left px-4 pb-2">
            <SheetTitle className="text-base">{item.contactName}</SheetTitle>
            <p className="text-sm text-muted-foreground">{titleText}</p>
          </SheetHeader>

          {!showSnoozeOptions ? (
            <div className="divide-y divide-border/30">
              <button
                className={actionButtonClass}
                onClick={() => { close(); onComplete(item) }}
              >
                ✓ Complete
              </button>
              <button
                className={actionButtonClass}
                onClick={() => setShowSnoozeOptions(true)}
              >
                ⏰ Snooze
              </button>
              {item.reminder.type === 'recurring' && (
                <button className={actionButtonClass} onClick={handleSkip}>
                  ⏭ Skip
                </button>
              )}
              <button
                className={`${actionButtonClass} text-red-500`}
                onClick={() => { close(); setShowDeleteConfirm(true) }}
              >
                🗑 Delete
              </button>
            </div>
          ) : !showDatePicker ? (
            <div className="divide-y divide-border/30">
              <button className={actionButtonClass} onClick={() => handleSnooze(tomorrow)}>
                Tomorrow
              </button>
              <button className={actionButtonClass} onClick={() => handleSnooze(in3Days)}>
                In 3 days
              </button>
              <button className={actionButtonClass} onClick={() => setShowDatePicker(true)}>
                Pick a date…
              </button>
              <button
                className={`${actionButtonClass} text-muted-foreground`}
                onClick={() => setShowSnoozeOptions(false)}
              >
                ← Back
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={(date) => { if (date) handleSnooze(date) }}
                disabled={(date) => date < new Date()}
              />
              <button
                className="text-sm text-muted-foreground mt-2"
                onClick={() => setShowDatePicker(false)}
              >
                ← Back
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function TodayList({ overdue, dueToday, thisWeek }: TodayListProps) {
  const router = useRouter()
  const isEmpty = overdue.length === 0 && dueToday.length === 0 && thisWeek.length === 0
  const [actionTarget, setActionTarget] = useState<ReminderRow | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  async function handleComplete(item: ReminderRow) {
    try {
      const prev = await completeReminder(item.reminder.id)
      const message = item.reminder.type === 'recurring' && item.reminder.frequencyDays
        ? `Next check-in in ${item.reminder.frequencyDays} days`
        : 'Completed'
      toast(message, {
        action: {
          label: 'Undo',
          onClick: () => undoReminderAction(item.reminder.id, prev.dueDate, prev.completed),
        },
        duration: 5000,
      })
    } catch {
      toast.error('Failed to complete reminder')
    }
  }

  function handleLongPress(item: ReminderRow) {
    setActionTarget(item)
    setSheetOpen(true)
  }

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
              <SwipeableRow key={item.reminder.id} onSwipeComplete={() => handleComplete(item)} onLongPress={() => handleLongPress(item)} onTap={() => router.push(`/people/${item.contactId}`)}>
                <ReminderRow item={item} priority="overdue" />
              </SwipeableRow>
            ))}
            {dueToday.map((item) => (
              <SwipeableRow key={item.reminder.id} onSwipeComplete={() => handleComplete(item)} onLongPress={() => handleLongPress(item)} onTap={() => router.push(`/people/${item.contactId}`)}>
                <ReminderRow item={item} priority="today" />
              </SwipeableRow>
            ))}
            {thisWeek.map((item) => (
              <SwipeableRow key={item.reminder.id} onSwipeComplete={() => handleComplete(item)} onLongPress={() => handleLongPress(item)} onTap={() => router.push(`/people/${item.contactId}`)}>
                <ReminderRow item={item} priority="week" />
              </SwipeableRow>
            ))}
          </div>
        )}
      </main>

      <ReminderActionSheet
        item={actionTarget}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onComplete={handleComplete}
      />
    </PullToRefreshWrapper>
  )
}
