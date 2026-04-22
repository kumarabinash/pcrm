# Home Screen Reminders Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich home screen reminder rows with more information and add swipe-to-complete, long-press action menu, snooze, skip, delete, and undo support.

**Architecture:** Extend the existing `today-list.tsx` client component with a 3-line row layout, touch-gesture handlers for swipe and long-press, a bottom sheet action menu, and sonner toasts for undo. Add three new server actions (`snoozeReminder`, `skipReminder`, `undoReminderAction`) alongside the existing ones in `app/actions/reminders.ts`. Modify `completeReminder` to return previous state for undo.

**Tech Stack:** Next.js 15 (App Router, Server Actions), TypeScript, Tailwind CSS, shadcn/ui (Sheet, AlertDialog, Calendar, Popover), sonner (toast), Framer Motion (animations), date-fns.

**Spec:** `docs/superpowers/specs/2026-04-22-home-reminders-enrichment-design.md`

---

## File Structure

| File | Role | Action |
|------|------|--------|
| `app/actions/reminders.ts` | Server actions for reminder CRUD | Modify — update `completeReminder` return value, add `snoozeReminder`, `skipReminder`, `undoReminderAction` |
| `app/(app)/page.tsx` | Home page server component | Modify — pass `frequencyDays` in reminder data |
| `app/(app)/today-list.tsx` | Home screen reminder list client component | Major rewrite — 3-line row, swipe, long-press, action sheet, undo toast |

No new files are created. All changes are to existing files.

---

### Task 1: Update Server Actions

**Files:**
- Modify: `app/actions/reminders.ts`

- [ ] **Step 1: Update `completeReminder` to return previous state**

In `app/actions/reminders.ts`, change the `completeReminder` function to return the previous `dueDate` and `completed` values so the client can pass them to undo:

```typescript
export async function completeReminder(reminderId: string) {
  const userId = await requireAuth()

  const [existing] = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

  const previousState = {
    dueDate: existing.dueDate,
    completed: existing.completed,
    contactId: existing.contactId,
  }

  if (existing.type === 'one-off') {
    await db
      .update(reminders)
      .set({ completed: true })
      .where(eq(reminders.id, reminderId))
  } else if (existing.frequencyDays) {
    const newDueDate = new Date()
    newDueDate.setDate(newDueDate.getDate() + existing.frequencyDays)
    await db
      .update(reminders)
      .set({ dueDate: newDueDate })
      .where(eq(reminders.id, reminderId))
  }

  revalidatePath(`/people/${existing.contactId}`)
  revalidatePath('/')
  return previousState
}
```

- [ ] **Step 2: Add `snoozeReminder` action**

Append to `app/actions/reminders.ts`:

```typescript
export async function snoozeReminder(reminderId: string, newDate: Date) {
  const userId = await requireAuth()

  const [existing] = await db
    .select({ id: reminders.id, dueDate: reminders.dueDate, contactId: reminders.contactId })
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

  const previousDueDate = existing.dueDate

  await db
    .update(reminders)
    .set({ dueDate: newDate })
    .where(eq(reminders.id, reminderId))

  revalidatePath(`/people/${existing.contactId}`)
  revalidatePath('/')
  return { previousDueDate, contactId: existing.contactId }
}
```

- [ ] **Step 3: Add `skipReminder` action**

Append to `app/actions/reminders.ts`:

```typescript
export async function skipReminder(reminderId: string) {
  const userId = await requireAuth()

  const [existing] = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')
  if (existing.type !== 'recurring' || !existing.frequencyDays) {
    throw new Error('Can only skip recurring reminders')
  }

  const previousDueDate = existing.dueDate
  const newDueDate = new Date()
  newDueDate.setDate(newDueDate.getDate() + existing.frequencyDays)

  await db
    .update(reminders)
    .set({ dueDate: newDueDate })
    .where(eq(reminders.id, reminderId))

  revalidatePath(`/people/${existing.contactId}`)
  revalidatePath('/')
  return { previousDueDate, contactId: existing.contactId, frequencyDays: existing.frequencyDays }
}
```

- [ ] **Step 4: Add `undoReminderAction` action**

Append to `app/actions/reminders.ts`:

```typescript
export async function undoReminderAction(
  reminderId: string,
  previousDueDate: Date,
  previousCompleted: boolean,
) {
  const userId = await requireAuth()

  const [existing] = await db
    .select({ id: reminders.id, contactId: reminders.contactId })
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

  await db
    .update(reminders)
    .set({ dueDate: previousDueDate, completed: previousCompleted })
    .where(eq(reminders.id, reminderId))

  revalidatePath(`/people/${existing.contactId}`)
  revalidatePath('/')
}
```

- [ ] **Step 5: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors in `app/actions/reminders.ts`

- [ ] **Step 6: Commit**

```bash
git add app/actions/reminders.ts
git commit -m "feat: add snooze, skip, undo server actions and update completeReminder return"
```

---

### Task 2: Pass `frequencyDays` from Home Page to Client

**Files:**
- Modify: `app/(app)/page.tsx`

The queries `getTodayReminders` and `getWeekReminders` already select the full `reminders` row (via `reminder: reminders`), which includes `frequencyDays`. The `TodayListProps` interface in `today-list.tsx` constrains what's passed. No query changes are needed — just the interface and page need updating.

- [ ] **Step 1: Verify queries already include frequencyDays**

Read `lib/db/queries.ts` lines 97-143. Confirm `getTodayReminders` and `getWeekReminders` select `reminder: reminders` (the full row), which includes `frequencyDays`. No query changes needed.

- [ ] **Step 2: Update the page component to pass frequencyDays**

In `app/(app)/page.tsx`, the data already flows through — the `reminder` object from the query includes all columns. The only change needed is in the `TodayList` component's interface (Task 3). No changes to `page.tsx` itself.

- [ ] **Step 3: Commit (skip if no changes)**

If `page.tsx` required no changes, skip this commit — the interface change happens in Task 3.

---

### Task 3: Rewrite `today-list.tsx` — Row Layout

**Files:**
- Modify: `app/(app)/today-list.tsx`

This task updates the row layout to the 3-line spacious design. Swipe and long-press are added in Tasks 4 and 5.

- [ ] **Step 1: Update the `ReminderRow` interface to include `frequencyDays`**

```typescript
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
```

- [ ] **Step 2: Replace `priorityDot` with a status pill component**

Remove the `priorityDot` function. Add a `StatusPill` component:

```typescript
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
```

Add `formatDistanceToNowStrict` to the `date-fns` import at the top of the file:

```typescript
import { format, formatDistanceToNowStrict } from 'date-fns'
```

- [ ] **Step 3: Add a priority circle component**

This replaces the solid dot with a bordered circle that uses priority colors:

```typescript
function PriorityCircle({ priority }: { priority: 'overdue' | 'today' | 'week' }) {
  const colors = { overdue: 'border-red-500', today: 'border-amber-500', week: 'border-green-500' }
  return <div className={`w-[22px] h-[22px] rounded-full border-2 ${colors[priority]} shrink-0`} />
}
```

- [ ] **Step 4: Rewrite the `ReminderRow` component with 3-line layout**

Replace the existing `ReminderRow` component:

```typescript
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
```

- [ ] **Step 5: Verify the page renders**

Run: `npm run dev` and check `http://localhost:3000`. Verify the 3-line row layout renders with status pills and metadata. If there are no reminders in the database, check the empty state still works.

- [ ] **Step 6: Commit**

```bash
git add app/(app)/today-list.tsx
git commit -m "feat: enriched 3-line reminder row with status pill and metadata"
```

---

### Task 4: Add Swipe-to-Complete Gesture

**Files:**
- Modify: `app/(app)/today-list.tsx`

- [ ] **Step 1: Add the `completeReminder` and `undoReminderAction` imports**

At the top of `today-list.tsx`, add:

```typescript
import { completeReminder, undoReminderAction } from '@/app/actions/reminders'
import { toast } from 'sonner'
```

- [ ] **Step 2: Create a `SwipeableRow` wrapper component**

Add this component inside `today-list.tsx`. It wraps each reminder row and handles touch gestures for swipe-to-complete. It renders a green background behind the row content that's revealed as the user swipes right:

```typescript
function SwipeableRow({
  children,
  onSwipeComplete,
}: {
  children: React.ReactNode
  onSwipeComplete: () => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const isTracking = useRef(false)
  const directionDecided = useRef(false)

  const THRESHOLD = 100

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    currentX.current = 0
    isTracking.current = false
    directionDecided.current = false
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaX = e.touches[0].clientX - startX.current
    const deltaY = e.touches[0].clientY - startY.current

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
    if (!isTracking.current) return

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
      {/* Green background revealed on swipe */}
      <div className="absolute inset-0 bg-green-500 flex items-center pl-4">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      {/* Foreground row */}
      <div
        ref={rowRef}
        className="relative bg-background"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
```

Add `useRef` to the React import at the top of the file:

```typescript
import { useRef } from 'react'
```

- [ ] **Step 3: Create a `handleComplete` helper and wrap rows with `SwipeableRow`**

In the `TodayList` component, add a helper function and update the row rendering. Replace the content inside `<div className="divide-y divide-border/30">`:

```typescript
function TodayList({ overdue, dueToday, thisWeek }: TodayListProps) {
  const router = useRouter()
  const isEmpty = overdue.length === 0 && dueToday.length === 0 && thisWeek.length === 0

  async function handleComplete(item: ReminderRow) {
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
  }

  function renderRow(item: ReminderRow, priority: 'overdue' | 'today' | 'week') {
    return (
      <SwipeableRow key={item.reminder.id} onSwipeComplete={() => handleComplete(item)}>
        <ReminderRow item={item} priority={priority} />
      </SwipeableRow>
    )
  }

  return (
    <PullToRefreshWrapper onRefresh={async () => { router.refresh() }}>
      {/* ... header stays the same ... */}
      <main className="max-w-lg mx-auto">
        {isEmpty ? (
          <div className="py-24 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-muted-foreground text-sm">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {overdue.map((item) => renderRow(item, 'overdue'))}
            {dueToday.map((item) => renderRow(item, 'today'))}
            {thisWeek.map((item) => renderRow(item, 'week'))}
          </div>
        )}
      </main>
    </PullToRefreshWrapper>
  )
}
```

- [ ] **Step 4: Test swipe gesture on mobile or dev tools (touch simulation)**

Run: `npm run dev` and open Chrome DevTools with device emulation. Swipe a reminder row right past 100px. Verify:
- Green background with checkmark reveals behind the row
- Row slides out and disappears after release past threshold
- Toast appears with undo button
- Row snaps back if released before threshold

- [ ] **Step 5: Commit**

```bash
git add app/(app)/today-list.tsx
git commit -m "feat: add swipe-to-complete gesture with undo toast"
```

---

### Task 5: Add Long-Press Action Menu

**Files:**
- Modify: `app/(app)/today-list.tsx`

- [ ] **Step 1: Add imports for the action menu components and remaining server actions**

At the top of `today-list.tsx`, update imports:

```typescript
import { useState, useRef, useCallback } from 'react'
import { completeReminder, undoReminderAction, snoozeReminder, skipReminder, deleteReminder } from '@/app/actions/reminders'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
```

- [ ] **Step 2: Add long-press detection to `SwipeableRow`**

Update the `SwipeableRow` component to accept an `onLongPress` callback and detect 500ms hold:

```typescript
function SwipeableRow({
  children,
  onSwipeComplete,
  onLongPress,
}: {
  children: React.ReactNode
  onSwipeComplete: () => void
  onLongPress: () => void
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

    // Cancel long-press if finger moves
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

    if (!isTracking.current) return

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
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create the `ReminderActionSheet` component**

Add this component in `today-list.tsx`. It shows the long-press action menu as a bottom sheet:

```typescript
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
  }

  async function handleSnooze(date: Date) {
    const result = await snoozeReminder(item!.reminder.id, date)
    close()
    toast(`Snoozed until ${format(date, 'MMM d')}`, {
      action: {
        label: 'Undo',
        onClick: () => undoReminderAction(item!.reminder.id, result.previousDueDate, false),
      },
      duration: 5000,
    })
  }

  async function handleSkip() {
    const result = await skipReminder(item!.reminder.id)
    close()
    toast(`Skipped — next in ${result.frequencyDays} days`, {
      action: {
        label: 'Undo',
        onClick: () => undoReminderAction(item!.reminder.id, result.previousDueDate, false),
      },
      duration: 5000,
    })
  }

  async function handleDelete() {
    await deleteReminder(item!.reminder.id)
    close()
    setShowDeleteConfirm(false)
    toast('Reminder deleted')
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
```

- [ ] **Step 4: Wire up long-press and action sheet in `TodayList`**

Update the `TodayList` component to manage the action sheet state:

```typescript
export function TodayList({ overdue, dueToday, thisWeek }: TodayListProps) {
  const router = useRouter()
  const isEmpty = overdue.length === 0 && dueToday.length === 0 && thisWeek.length === 0
  const [actionTarget, setActionTarget] = useState<ReminderRow | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  async function handleComplete(item: ReminderRow) {
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
  }

  function handleLongPress(item: ReminderRow) {
    setActionTarget(item)
    setSheetOpen(true)
  }

  function renderRow(item: ReminderRow, priority: 'overdue' | 'today' | 'week') {
    return (
      <SwipeableRow
        key={item.reminder.id}
        onSwipeComplete={() => handleComplete(item)}
        onLongPress={() => handleLongPress(item)}
      >
        <ReminderRow item={item} priority={priority} />
      </SwipeableRow>
    )
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
            {overdue.map((item) => renderRow(item, 'overdue'))}
            {dueToday.map((item) => renderRow(item, 'today'))}
            {thisWeek.map((item) => renderRow(item, 'week'))}
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
```

- [ ] **Step 5: Verify the full flow**

Run: `npm run dev` with Chrome DevTools device emulation.

Test each interaction:
1. **Swipe right** past threshold → row disappears, toast with undo appears
2. **Long-press** a row → bottom sheet opens with Complete, Snooze, Skip (recurring only), Delete
3. **Snooze → Tomorrow** → sheet closes, toast "Snoozed until {date}" with undo
4. **Snooze → In 3 days** → same behavior
5. **Snooze → Pick a date** → calendar appears, select date → snooze fires
6. **Skip** (on recurring) → toast "Skipped — next in N days"
7. **Delete** → confirmation dialog → confirm → reminder removed, toast "Reminder deleted"
8. **Undo** on any toast → reminder restored

- [ ] **Step 6: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add app/(app)/today-list.tsx
git commit -m "feat: add long-press action menu with snooze, skip, delete, and undo"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run a full build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors

- [ ] **Step 2: Commit any remaining changes**

```bash
git status
# If any files need committing:
git add -A && git commit -m "chore: final cleanup for reminder enrichment"
```
