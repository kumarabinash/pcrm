# UI Polish — Icons, Selection, Navigation Loading, Bottom Bar

**Date:** 2026-04-22
**Status:** Draft

## Problem

Five usability issues on the mobile PWA:

1. Long-pressing a reminder row triggers Safari's text selection (blue highlight)
2. Action sheet buttons, metadata indicators, and bottom tab bar use text characters/emoji instead of proper icons
3. Bottom tab bar active state is weak — needs a stronger visual highlight
4. FAB is too close to the bottom tab bar
5. No loading feedback when navigating between pages

## Fixes

### 1. Prevent Text Selection on Long-Press

Add `-webkit-user-select: none; user-select: none` to the `SwipeableRow` inner div (the one with touch handlers). This blocks Safari from entering text selection mode during the 500ms hold.

**File:** `app/(app)/today-list.tsx`
**Change:** Add `select-none` Tailwind class to the foreground div in `SwipeableRow`.

### 2. Replace Text Characters with Lucide Icons

All actionable UI elements and indicators should use `lucide-react` icons. The project already uses lucide-react extensively.

**File:** `app/(app)/today-list.tsx`

**Action sheet buttons:**

| Current | Replacement | Lucide Icon |
|---------|-------------|-------------|
| `✓ Complete` | icon + "Complete" | `Check` |
| `⏰ Snooze` | icon + "Snooze" | `Clock` |
| `⏭ Skip` | icon + "Skip" | `SkipForward` |
| `🗑 Delete` | icon + "Delete" | `Trash2` |
| `← Back` | icon + "Back" | `ArrowLeft` |

Button layout: `flex items-center gap-3` with icon `w-5 h-5` and text label.

**Metadata line in ReminderRow:**

| Current | Replacement | Lucide Icon |
|---------|-------------|-------------|
| `🔁 Every 14d` | icon + "Every 14d" | `Repeat` (w-3 h-3) |
| `📅 Apr 24` | icon + "Apr 24" | `CalendarDays` (w-3 h-3) |

Metadata parts become JSX elements (not joined strings) with inline icons.

**Keep as-is:**
- `🎉` in empty state — decorative, not actionable

### 3. Bottom Tab Bar — Lucide Icons + Active Highlight

**File:** `components/BottomTabBar.tsx`

**Icon replacements:**

| Current | Lucide Icon |
|---------|-------------|
| `🏠` Today | `Home` |
| `👥` People | `Users` |
| `📋` Log | `ClipboardList` |
| `⚙️` Settings | `Settings` |

**Active state — pill highlight:**
- Wrap the icon in a container div
- Active: `bg-primary/15 rounded-full px-3 py-1.5` behind the icon
- Active icon: `strokeWidth={2.25}`, text bold
- Inactive icon: `strokeWidth={1.75}`, text normal
- Smooth transition: `transition-all duration-200`

### 4. FAB — Icon + Bottom Padding

**File:** `components/Fab.tsx`

- Replace `+` text character with `<Plus />` from lucide-react (`w-6 h-6 text-primary-foreground`)
- Increase bottom offset: change `bottom: calc(68px + env(safe-area-inset-bottom))` to `bottom: calc(80px + env(safe-area-inset-bottom))` (12px more breathing room)

### 5. Navigation Loading Indicator

**New file:** `components/NavigationProgress.tsx`

A thin progress bar at the very top of the viewport that animates during route transitions.

**How it works:**
- Uses `usePathname()` from `next/navigation`
- On pathname change: show bar, animate width from 0% → 90% (fast), then on completion → 100% and fade out
- Bar styling: `fixed top-0 left-0 z-50 h-0.5 bg-primary` with CSS transition
- Respects safe-area-inset-top (positioned at the very top, above the sticky header)

**Mount in:** `app/(app)/layout.tsx` — add `<NavigationProgress />` inside the layout.

## Files Summary

| File | Change |
|------|--------|
| `app/(app)/today-list.tsx` | `select-none` on SwipeableRow, Lucide icons in action sheet + metadata line |
| `components/BottomTabBar.tsx` | Lucide icons, active pill highlight |
| `components/Fab.tsx` | Lucide Plus icon, increased bottom offset |
| `components/NavigationProgress.tsx` | New — progress bar on route change |
| `app/(app)/layout.tsx` | Mount NavigationProgress |

## Out of Scope

- Replacing emoji in interaction types (`📞`, `💬`, etc.) — those are in a different feature area
- Replacing mood emoji (`😊`, `😐`, etc.) — those are domain-specific
- Skeleton loading screens for individual pages
