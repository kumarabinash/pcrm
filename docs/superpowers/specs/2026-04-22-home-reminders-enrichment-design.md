# Home Screen Reminders — Enrichment & Actions

**Date:** 2026-04-22
**Status:** Draft

## Problem

The home screen reminder rows are too basic — they show only a contact name, brief label, and color dot. There's no way to complete, snooze, or dismiss a reminder without navigating to the contact's profile or logging an interaction. The `ReminderItem` component has `onComplete` and `onDelete` props but they're never wired up.

## Goals

1. Show richer information on each reminder row so users can triage without tapping in
2. Let users complete reminders directly from the home screen via swipe
3. Provide secondary actions (snooze, skip, delete) via long-press menu

## Design

### 1. Enriched Reminder Row — 3-Line Spacious Layout

Each reminder row in `today-list.tsx` changes from 2 lines to 3:

```
[○] Sarah Chen                          [3d overdue]
    Check in
    🔁 Every 14d · 📅 Due Apr 19

[○] James Wu                               [today]
    Check in at 2:00 PM
    🔁 Every 7d

[○] Maria Lopez                              [Thu]
    Coffee catch-up
    📅 Apr 24 · One-off
```

**Line 1:** Contact name (left, bold) + status pill (right, color-coded)
- Overdue: red pill with relative duration ("3d overdue")
- Due today: amber pill ("today")
- This week: green pill with day name ("Thu")

**Line 2:** Reminder title + time
- Uses `title` if set, otherwise defaults: "Check in" (recurring) / "Reminder" (one-off)
- Appends `" at {time}"` if time is set

**Line 3:** Metadata row
- Recurring: "🔁 Every {frequencyDays}d" + "📅 {due date}" if not today
- One-off: "📅 {date}" + "One-off"
- Separator: " · " between items

**Left edge:** Priority-colored circle (22px, border only, no fill) replaces the solid 10px dot. This circle is the visual anchor for the swipe gesture. Colors match the status pill (red/amber/green).

### 2. Swipe to Complete

Implemented as a horizontal touch gesture on each reminder row.

**Gesture behavior:**
- Track `touchstart`, `touchmove`, `touchend` on the row
- Reveal a green background with checkmark icon as the row slides right
- Threshold: 100px horizontal displacement to trigger completion
- If released before threshold, row snaps back

**On completion trigger:**
- Call `completeReminder(reminderId)` server action
- **Recurring reminders:** advances `dueDate` by `frequencyDays` (existing behavior)
- **One-off reminders:** sets `completed = true` (existing behavior)
- Row animates out (height collapse + opacity fade, ~300ms)
- Show undo toast at bottom of screen

**Conflicts mitigation:**
- Only start horizontal tracking if `deltaX > deltaY` in the first 10px of movement
- This prevents conflicts with vertical scrolling and pull-to-refresh
- Ignore swipes that start on interactive elements inside the row

### 3. Long-Press Action Menu

Long-press (500ms hold) on a reminder row opens a bottom sheet with actions.

**Actions:**

| Action | Behavior | Available |
|--------|----------|-----------|
| Complete | Same as swipe — advance or mark done | All |
| Snooze | Push due date forward (see snooze options) | All |
| Skip | Advance `dueDate` by `frequencyDays` without "completing" | Recurring only |
| Delete | Hard-delete after confirmation dialog | All |

**Snooze sub-options** (shown inline in the sheet when "Snooze" is tapped):
- **Tomorrow** — sets `dueDate` to tomorrow
- **In 3 days** — sets `dueDate` to today + 3 days
- **Pick a date** — opens a date picker, sets `dueDate` to chosen date

**Delete confirmation:** Simple alert dialog — "Delete this reminder? This can't be undone." with Cancel / Delete buttons.

**UI:** Use the existing shadcn Sheet component (`components/ui/sheet.tsx`), anchored to bottom. Show the contact name and reminder title in the sheet header for context.

### 4. Undo Toast

After complete, snooze, or skip actions:
- Toast appears at bottom of screen (above safe area)
- Shows action description + "Undo" button
- Auto-dismisses after 5 seconds
- Tapping "Undo" reverses the action:
  - Complete: restores previous `dueDate` (recurring) or sets `completed = false` (one-off)
  - Snooze: restores previous `dueDate`
  - Skip: restores previous `dueDate`
- Only one toast visible at a time — new action replaces previous toast
- Use shadcn toast/sonner component if available, otherwise a simple fixed-position div

**Toast messages:**
- Complete (recurring): "Next check-in in {frequencyDays} days — Undo"
- Complete (one-off): "Completed — Undo"
- Snooze: "Snoozed until {date} — Undo"
- Skip: "Skipped — next in {frequencyDays} days — Undo"

### 5. Server Actions

**Existing (minor changes needed):**
- `completeReminder(id)` — handles both recurring (advance) and one-off (mark done). **Needs to return previous `dueDate` and `completed` values** so the client can pass them to undo.
- `deleteReminder(id)` — hard-deletes with ownership check. No undo for delete (confirmed via dialog).

**New actions in `app/actions/reminders.ts`:**

```typescript
snoozeReminder(id: string, newDate: Date)
```
- Validates user owns the reminder
- Updates `dueDate` to `newDate`
- Returns the previous `dueDate` (for undo)
- Revalidates `/` and `/people/{contactId}`

```typescript
skipReminder(id: string)
```
- Validates user owns the reminder
- Validates reminder is recurring (error if one-off)
- Advances `dueDate` by `frequencyDays`
- Returns the previous `dueDate` (for undo)
- Revalidates `/` and `/people/{contactId}`

```typescript
undoReminderAction(id: string, previousDueDate: Date, previousCompleted: boolean)
```
- Restores `dueDate` and `completed` to previous values
- Revalidates paths

### 6. Data Flow

The `ReminderRow` interface needs `frequencyDays` added:

```typescript
interface ReminderRow {
  reminder: {
    id: string
    dueDate: Date
    title: string | null
    type: string
    time: string | null
    frequencyDays: number | null  // NEW
  }
  contactName: string
  contactId: string
}
```

The home page query (`getTodayReminders`, `getWeekReminders`) already joins reminders with contacts. They need to include `frequencyDays` in the select.

### 7. Files to Modify

| File | Change |
|------|--------|
| `app/(app)/today-list.tsx` | Major rewrite — new row layout, swipe gesture, long-press handler, undo toast |
| `app/(app)/page.tsx` | Pass `frequencyDays` in reminder data |
| `app/actions/reminders.ts` | Add `snoozeReminder`, `skipReminder`, `undoReminderAction` |
| `lib/db/queries.ts` | Include `frequencyDays` in reminder queries |

### 8. No New Dependencies

- Swipe gesture: vanilla touch events (no library needed)
- Long-press: vanilla `setTimeout` on `touchstart`/`pointerdown`
- Bottom sheet: existing shadcn Sheet component
- Toast: sonner (already in shadcn setup) or existing toast component
- Date picker: existing shadcn calendar/popover components
- Animations: Framer Motion (already installed)

## Out of Scope

- Changing the reminder creation flow
- Modifying the contact profile reminder display
- Push notification changes
- Batch operations (select multiple reminders)
