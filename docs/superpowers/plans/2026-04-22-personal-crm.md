# Personal CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first personal CRM with contacts, interaction logging, reminders, and push notifications on the existing Next.js 15 PWA boilerplate.

**Architecture:** Extend the existing Drizzle schema with 5 new tables (contacts, tags, contact_tags, interactions, reminders). Add 4 new route groups (/, /people, /log, /settings) with a bottom tab bar and FAB. Server actions handle all mutations. OneSignal + Vercel Cron power notifications.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon Postgres, OneSignal, Vercel Cron, Framer Motion, vaul (drawer), cmdk (command palette)

---

## File Structure

### New Files

```
lib/db/schema.ts                          — MODIFY: add contacts, tags, contactTags, interactions, reminders tables
lib/db/queries.ts                         — CREATE: reusable query functions (getContacts, getTodayReminders, etc.)
app/actions/contacts.ts                   — CREATE: contact CRUD server actions
app/actions/interactions.ts               — CREATE: interaction CRUD server actions
app/actions/reminders.ts                  — CREATE: reminder CRUD server actions
app/actions/tags.ts                       — CREATE: tag CRUD server actions
app/(app)/layout.tsx                      — CREATE: shared layout with bottom tab bar + FAB
app/(app)/page.tsx                        — CREATE: Today view (replaces current app/page.tsx)
app/(app)/people/page.tsx                 — CREATE: contacts list with search + filters
app/(app)/people/[id]/page.tsx            — CREATE: contact profile
app/(app)/people/[id]/edit/page.tsx       — CREATE: edit contact form
app/(app)/people/new/page.tsx             — CREATE: new contact form
app/(app)/log/page.tsx                    — CREATE: activity feed
app/(app)/settings/page.tsx               — CREATE: settings page (wraps existing SettingsSheet content)
components/BottomTabBar.tsx               — CREATE: bottom navigation tabs
components/Fab.tsx                        — CREATE: floating action button
components/QuickLogSheet.tsx              — CREATE: bottom sheet for quick interaction logging
components/ContactCard.tsx                — CREATE: contact row component for lists
components/InteractionItem.tsx            — CREATE: interaction entry component for timelines
components/ReminderItem.tsx               — CREATE: reminder row component
components/TagChip.tsx                    — CREATE: colored tag pill component
components/ContactPicker.tsx              — CREATE: searchable contact selector using cmdk
components/InteractionTypePicker.tsx      — CREATE: pill selector for interaction types
components/MoodPicker.tsx                 — CREATE: emoji mood selector
components/TopicInput.tsx                 — CREATE: tag-style topic input
components/AddReminderSheet.tsx           — CREATE: bottom sheet for adding reminders
app/api/cron/reminders/route.ts           — MODIFY: implement digest + individual reminder notifications
```

### Modified Files

```
app/page.tsx                              — DELETE (replaced by app/(app)/page.tsx)
app/layout.tsx                            — MODIFY: update metadata title/description
middleware.ts                             — MODIFY: allow /api/cron route without auth
components/SettingsSheet.tsx              — MODIFY: add digest time + CRM notification toggles
lib/db/schema.ts                          — MODIFY: add new tables + contactId to attachments
```

---

## Task 1: Database Schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add CRM tables to schema**

Add these table definitions after the existing `notificationPreferences` table in `lib/db/schema.ts`:

```typescript
// --- CRM: Contacts ---

export const contacts = pgTable('contact', {
  id:               text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:           text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:             text('name').notNull(),
  phone:            text('phone'),
  email:            text('email'),
  birthday:         text('birthday'),
  location:         text('location'),
  howWeMet:         text('how_we_met'),
  relationshipType: text('relationship_type'),
  notes:            text('notes'),
  photoUrl:         text('photo_url'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
})

// --- CRM: Tags ---

export const tags = pgTable('tag', {
  id:     text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:   text('name').notNull(),
  color:  text('color'),
})

// --- CRM: Contact ↔ Tag join ---

export const contactTags = pgTable('contact_tag', {
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  tagId:     text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.contactId, t.tagId] })])

// --- CRM: Interactions ---

export const interactions = pgTable('interaction', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:      text('type').notNull(),
  note:      text('note'),
  details:   text('details'),
  topics:    text('topics').array(),
  mood:      text('mood'),
  date:      timestamp('date', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// --- CRM: Reminders ---

export const reminders = pgTable('reminder', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contactId:     text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  userId:        text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:          text('type').notNull(),
  frequencyDays: integer('frequency_days'),
  dueDate:       timestamp('due_date', { mode: 'date' }).notNull(),
  time:          text('time'),
  title:         text('title'),
  completed:     boolean('completed').notNull().default(false),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
})
```

- [ ] **Step 2: Add contactId to attachments table**

In the existing `attachments` table definition in `lib/db/schema.ts`, add this column after `storageKey`:

```typescript
  contactId:  text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
```

- [ ] **Step 3: Add CRM notification preference columns**

In the existing `notificationPreferences` table, add these columns after `onStatusChanged`:

```typescript
  digestEnabled:     boolean('digest_enabled').notNull().default(true),
  digestHour:        integer('digest_hour').notNull().default(8),
  remindersEnabled:  boolean('reminders_enabled').notNull().default(true),
```

- [ ] **Step 4: Generate and apply migration**

Run:
```bash
npm run db:generate
```
Expected: New migration file created in `drizzle/` directory.

Then run:
```bash
npm run db:push
```
Expected: Schema synced to database.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(db): add CRM tables — contacts, tags, interactions, reminders"
```

---

## Task 2: Database Query Functions

**Files:**
- Create: `lib/db/queries.ts`

- [ ] **Step 1: Create query functions file**

Create `lib/db/queries.ts` with reusable query functions. These are used by server actions and page components.

```typescript
import { db } from '@/lib/db'
import {
  contacts, tags, contactTags, interactions, reminders, attachments,
} from '@/lib/db/schema'
import { eq, and, desc, asc, lte, sql, ilike } from 'drizzle-orm'

// ── Contacts ──

export async function getContacts(userId: string) {
  const rows = await db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId))
    .orderBy(asc(contacts.name))
  return rows
}

export async function getContact(userId: string, contactId: string) {
  const [row] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function searchContacts(userId: string, query: string) {
  const rows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.userId, userId), ilike(contacts.name, `%${query}%`)))
    .orderBy(asc(contacts.name))
    .limit(20)
  return rows
}

// ── Tags ──

export async function getTagsForUser(userId: string) {
  return db.select().from(tags).where(eq(tags.userId, userId)).orderBy(asc(tags.name))
}

export async function getTagsForContact(contactId: string) {
  const rows = await db
    .select({ id: tags.id, name: tags.name, color: tags.color })
    .from(contactTags)
    .innerJoin(tags, eq(contactTags.tagId, tags.id))
    .where(eq(contactTags.contactId, contactId))
  return rows
}

// ── Interactions ──

export async function getInteractionsForContact(contactId: string) {
  return db
    .select()
    .from(interactions)
    .where(eq(interactions.contactId, contactId))
    .orderBy(desc(interactions.date))
}

export async function getAllInteractions(userId: string, limit = 50, offset = 0) {
  const rows = await db
    .select({
      interaction: interactions,
      contactName: contacts.name,
    })
    .from(interactions)
    .innerJoin(contacts, eq(interactions.contactId, contacts.id))
    .where(eq(interactions.userId, userId))
    .orderBy(desc(interactions.date))
    .limit(limit)
    .offset(offset)
  return rows
}

export async function getLastInteraction(contactId: string) {
  const [row] = await db
    .select()
    .from(interactions)
    .where(eq(interactions.contactId, contactId))
    .orderBy(desc(interactions.date))
    .limit(1)
  return row ?? null
}

// ── Reminders ──

export async function getRemindersForContact(contactId: string) {
  return db
    .select()
    .from(reminders)
    .where(and(eq(reminders.contactId, contactId), eq(reminders.completed, false)))
    .orderBy(asc(reminders.dueDate))
}

export async function getTodayReminders(userId: string) {
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const rows = await db
    .select({
      reminder: reminders,
      contactName: contacts.name,
      contactId: contacts.id,
    })
    .from(reminders)
    .innerJoin(contacts, eq(reminders.contactId, contacts.id))
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.completed, false),
        lte(reminders.dueDate, endOfDay),
      ),
    )
    .orderBy(asc(reminders.dueDate))
  return rows
}

export async function getWeekReminders(userId: string) {
  const now = new Date()
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59)

  const rows = await db
    .select({
      reminder: reminders,
      contactName: contacts.name,
      contactId: contacts.id,
    })
    .from(reminders)
    .innerJoin(contacts, eq(reminders.contactId, contacts.id))
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.completed, false),
        sql`${reminders.dueDate} >= ${startOfTomorrow}`,
        lte(reminders.dueDate, endOfWeek),
      ),
    )
    .orderBy(asc(reminders.dueDate))
  return rows
}

// ── Attachments (for contacts) ──

export async function getAttachmentsForContact(contactId: string) {
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.contactId, contactId))
    .orderBy(desc(attachments.createdAt))
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/queries.ts
git commit -m "feat(db): add CRM query functions"
```

---

## Task 3: Server Actions — Contacts

**Files:**
- Create: `app/actions/contacts.ts`

- [ ] **Step 1: Create contact server actions**

Create `app/actions/contacts.ts`:

```typescript
'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { contacts, contactTags } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createContact(data: {
  name: string
  phone?: string
  email?: string
  birthday?: string
  location?: string
  howWeMet?: string
  relationshipType?: string
  notes?: string
  tagIds?: string[]
}) {
  const userId = await requireAuth()
  const { tagIds, ...contactData } = data

  const [contact] = await db
    .insert(contacts)
    .values({ ...contactData, userId })
    .returning()

  if (tagIds?.length) {
    await db.insert(contactTags).values(
      tagIds.map((tagId) => ({ contactId: contact.id, tagId })),
    )
  }

  revalidatePath('/people')
  revalidatePath('/')
  return contact
}

export async function updateContact(
  contactId: string,
  data: {
    name?: string
    phone?: string
    email?: string
    birthday?: string
    location?: string
    howWeMet?: string
    relationshipType?: string
    notes?: string
    tagIds?: string[]
  },
) {
  const userId = await requireAuth()
  const { tagIds, ...contactData } = data

  const [existing] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

  await db
    .update(contacts)
    .set(contactData)
    .where(eq(contacts.id, contactId))

  if (tagIds !== undefined) {
    await db.delete(contactTags).where(eq(contactTags.contactId, contactId))
    if (tagIds.length) {
      await db.insert(contactTags).values(
        tagIds.map((tagId) => ({ contactId, tagId })),
      )
    }
  }

  revalidatePath(`/people/${contactId}`)
  revalidatePath('/people')
  revalidatePath('/')
}

export async function deleteContact(contactId: string) {
  const userId = await requireAuth()

  const [existing] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

  await db.delete(contacts).where(eq(contacts.id, contactId))

  revalidatePath('/people')
  revalidatePath('/')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/contacts.ts
git commit -m "feat: add contact CRUD server actions"
```

---

## Task 4: Server Actions — Interactions

**Files:**
- Create: `app/actions/interactions.ts`

- [ ] **Step 1: Create interaction server actions**

Create `app/actions/interactions.ts`:

```typescript
'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { interactions, reminders, contacts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createInteraction(data: {
  contactId: string
  type: string
  note?: string
  details?: string
  topics?: string[]
  mood?: string
  date?: Date
}) {
  const userId = await requireAuth()

  // Verify the contact belongs to this user
  const [contact] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, data.contactId), eq(contacts.userId, userId)))
    .limit(1)

  if (!contact) throw new Error('Contact not found')

  const [interaction] = await db
    .insert(interactions)
    .values({
      contactId: data.contactId,
      userId,
      type: data.type,
      note: data.note,
      details: data.details,
      topics: data.topics,
      mood: data.mood,
      date: data.date ?? new Date(),
    })
    .returning()

  // Auto-advance recurring reminders for this contact
  const recurringReminders = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.contactId, data.contactId),
        eq(reminders.type, 'recurring'),
        eq(reminders.completed, false),
      ),
    )

  for (const reminder of recurringReminders) {
    if (reminder.frequencyDays) {
      const newDueDate = new Date()
      newDueDate.setDate(newDueDate.getDate() + reminder.frequencyDays)
      await db
        .update(reminders)
        .set({ dueDate: newDueDate })
        .where(eq(reminders.id, reminder.id))
    }
  }

  revalidatePath(`/people/${data.contactId}`)
  revalidatePath('/log')
  revalidatePath('/')
  return interaction
}

export async function deleteInteraction(interactionId: string) {
  const userId = await requireAuth()

  const [existing] = await db
    .select({ id: interactions.id, contactId: interactions.contactId })
    .from(interactions)
    .where(and(eq(interactions.id, interactionId), eq(interactions.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

  await db.delete(interactions).where(eq(interactions.id, interactionId))

  revalidatePath(`/people/${existing.contactId}`)
  revalidatePath('/log')
  revalidatePath('/')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/interactions.ts
git commit -m "feat: add interaction server actions with reminder auto-advance"
```

---

## Task 5: Server Actions — Reminders & Tags

**Files:**
- Create: `app/actions/reminders.ts`
- Create: `app/actions/tags.ts`

- [ ] **Step 1: Create reminder server actions**

Create `app/actions/reminders.ts`:

```typescript
'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { reminders, contacts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createReminder(data: {
  contactId: string
  type: 'recurring' | 'one-off'
  frequencyDays?: number
  dueDate: Date
  time?: string
  title?: string
}) {
  const userId = await requireAuth()

  const [contact] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, data.contactId), eq(contacts.userId, userId)))
    .limit(1)

  if (!contact) throw new Error('Contact not found')

  const [reminder] = await db
    .insert(reminders)
    .values({
      contactId: data.contactId,
      userId,
      type: data.type,
      frequencyDays: data.frequencyDays,
      dueDate: data.dueDate,
      time: data.time,
      title: data.title,
    })
    .returning()

  revalidatePath(`/people/${data.contactId}`)
  revalidatePath('/')
  return reminder
}

export async function completeReminder(reminderId: string) {
  const userId = await requireAuth()

  const [existing] = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

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
}

export async function deleteReminder(reminderId: string) {
  const userId = await requireAuth()

  const [existing] = await db
    .select({ id: reminders.id, contactId: reminders.contactId })
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

  await db.delete(reminders).where(eq(reminders.id, reminderId))

  revalidatePath(`/people/${existing.contactId}`)
  revalidatePath('/')
}
```

- [ ] **Step 2: Create tag server actions**

Create `app/actions/tags.ts`:

```typescript
'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { tags } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createTag(data: { name: string; color?: string }) {
  const userId = await requireAuth()

  const [tag] = await db
    .insert(tags)
    .values({ userId, name: data.name, color: data.color })
    .returning()

  revalidatePath('/people')
  return tag
}

export async function deleteTag(tagId: string) {
  const userId = await requireAuth()

  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')

  await db.delete(tags).where(eq(tags.id, tagId))

  revalidatePath('/people')
}
```

- [ ] **Step 3: Commit**

```bash
git add app/actions/reminders.ts app/actions/tags.ts
git commit -m "feat: add reminder and tag server actions"
```

---

## Task 6: Shared UI Components

**Files:**
- Create: `components/TagChip.tsx`
- Create: `components/InteractionTypePicker.tsx`
- Create: `components/MoodPicker.tsx`
- Create: `components/TopicInput.tsx`
- Create: `components/ContactPicker.tsx`

- [ ] **Step 1: Create TagChip component**

Create `components/TagChip.tsx`:

```tsx
interface TagChipProps {
  name: string
  color?: string
  onRemove?: () => void
}

const DEFAULT_COLORS: Record<string, string> = {
  family: '#ef4444',
  work: '#a855f7',
  gym: '#3b82f6',
  college: '#a855f7',
  networking: '#3b82f6',
  mentor: '#22c55e',
  tech: '#3b82f6',
}

export function TagChip({ name, color, onRemove }: TagChipProps) {
  const c = color ?? DEFAULT_COLORS[name.toLowerCase()] ?? '#6b7280'

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: `${c}15`, color: c }}
    >
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70">
          ×
        </button>
      )}
    </span>
  )
}
```

- [ ] **Step 2: Create InteractionTypePicker component**

Create `components/InteractionTypePicker.tsx`:

```tsx
'use client'

const TYPES = [
  { value: 'call', label: 'Call', icon: '📞' },
  { value: 'text', label: 'Text', icon: '💬' },
  { value: 'in-person', label: 'In person', icon: '🤝' },
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'other', label: 'Other', icon: '📌' },
] as const

export type InteractionType = (typeof TYPES)[number]['value']

export function interactionIcon(type: string) {
  return TYPES.find((t) => t.value === type)?.icon ?? '📌'
}

interface InteractionTypePickerProps {
  value: string
  onChange: (value: string) => void
}

export function InteractionTypePicker({ value, onChange }: InteractionTypePickerProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={[
            'text-[13px] px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95',
            value === t.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/40 border border-border/40 text-muted-foreground hover:bg-muted/70',
          ].join(' ')}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create MoodPicker component**

Create `components/MoodPicker.tsx`:

```tsx
'use client'

const MOODS = [
  { value: 'great', emoji: '😊' },
  { value: 'good', emoji: '🙂' },
  { value: 'neutral', emoji: '😐' },
  { value: 'rough', emoji: '😔' },
] as const

export function moodEmoji(mood: string) {
  return MOODS.find((m) => m.value === mood)?.emoji ?? ''
}

interface MoodPickerProps {
  value?: string
  onChange: (value: string | undefined) => void
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="flex gap-2.5">
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(value === m.value ? undefined : m.value)}
          className={[
            'text-2xl p-1.5 rounded-lg transition-all duration-150 active:scale-90',
            value === m.value
              ? 'bg-primary/15 scale-110'
              : 'bg-muted/40 opacity-50 hover:opacity-75',
          ].join(' ')}
        >
          {m.emoji}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create TopicInput component**

Create `components/TopicInput.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface TopicInputProps {
  value: string[]
  onChange: (topics: string[]) => void
}

export function TopicInput({ value, onChange }: TopicInputProps) {
  const [input, setInput] = useState('')

  function addTopic() {
    const topic = input.trim().toLowerCase()
    if (topic && !value.includes(topic)) {
      onChange([...value, topic])
    }
    setInput('')
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {value.map((topic) => (
        <span
          key={topic}
          className="inline-flex items-center gap-1 text-[12px] px-3 py-1 rounded-full bg-muted/60 border border-border/40"
        >
          {topic}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== topic))}
            className="hover:opacity-70"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addTopic()
          }
        }}
        onBlur={addTopic}
        placeholder="+ add topic"
        className="text-[12px] px-3 py-1 rounded-full bg-muted/30 border border-border/30 outline-none w-24 placeholder:text-muted-foreground/40"
      />
    </div>
  )
}
```

- [ ] **Step 5: Create ContactPicker component**

Create `components/ContactPicker.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { searchContacts } from '@/lib/db/queries'

interface Contact {
  id: string
  name: string
  relationshipType: string | null
}

interface ContactPickerProps {
  userId: string
  value?: Contact | null
  onChange: (contact: Contact) => void
}

export function ContactPicker({ userId, value, onChange }: ContactPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contact[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      const contacts = await searchContacts(userId, query)
      setResults(contacts)
    }, 200)
    return () => clearTimeout(timeout)
  }, [query, userId])

  if (value && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3.5 py-3 text-left flex items-center gap-2.5"
      >
        <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
          {value.name[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium">{value.name}</span>
      </button>
    )
  }

  return (
    <Command className="rounded-xl border border-border/40 bg-muted/40" shouldFilter={false}>
      <CommandInput
        placeholder="Search contacts..."
        value={query}
        onValueChange={setQuery}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <CommandList>
          <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
            {query ? 'No contacts found' : 'Type to search'}
          </CommandEmpty>
          {results.map((contact) => (
            <CommandItem
              key={contact.id}
              onSelect={() => {
                onChange(contact)
                setOpen(false)
                setQuery('')
              }}
              className="flex items-center gap-2.5 px-3 py-2"
            >
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
                {contact.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{contact.name}</p>
                {contact.relationshipType && (
                  <p className="text-xs text-muted-foreground">{contact.relationshipType}</p>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandList>
      )}
    </Command>
  )
}
```

Note: `ContactPicker` calls `searchContacts` directly from the client. This works because `searchContacts` is in a regular module (not `'use server'`), but Drizzle queries must run server-side. We need to wrap this in a server action. Add to `app/actions/contacts.ts`:

```typescript
export async function searchContactsAction(query: string) {
  const userId = await requireAuth()
  return searchContacts(userId, query)
}
```

Then update `ContactPicker` to import and call `searchContactsAction` instead of `searchContacts`:

```tsx
import { searchContactsAction } from '@/app/actions/contacts'

// In the useEffect:
const contacts = await searchContactsAction(query)
```

Remove the `userId` prop from `ContactPickerProps` (no longer needed since the action reads it from the session).

- [ ] **Step 6: Commit**

```bash
git add components/TagChip.tsx components/InteractionTypePicker.tsx components/MoodPicker.tsx components/TopicInput.tsx components/ContactPicker.tsx app/actions/contacts.ts
git commit -m "feat: add shared CRM UI components — tags, pickers, topics"
```

---

## Task 7: App Shell — Layout with Tab Bar and FAB

**Files:**
- Create: `components/BottomTabBar.tsx`
- Create: `components/Fab.tsx`
- Create: `components/QuickLogSheet.tsx`
- Create: `app/(app)/layout.tsx`
- Modify: `app/layout.tsx`
- Delete content from: `app/page.tsx` (redirect to `/(app)`)

- [ ] **Step 1: Create BottomTabBar**

Create `components/BottomTabBar.tsx`:

```tsx
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
```

- [ ] **Step 2: Create FAB**

Create `components/Fab.tsx`:

```tsx
'use client'

interface FabProps {
  onClick: () => void
}

export function Fab({ onClick }: FabProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'fixed z-30 w-[52px] h-[52px] rounded-full',
        'bg-primary text-primary-foreground',
        'flex items-center justify-center text-2xl font-light',
        'shadow-lg shadow-primary/25',
        'transition-all duration-150 active:scale-90',
      ].join(' ')}
      style={{
        bottom: 'calc(68px + env(safe-area-inset-bottom))',
        right: '16px',
      }}
    >
      +
    </button>
  )
}
```

- [ ] **Step 3: Create QuickLogSheet**

Create `components/QuickLogSheet.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ContactPicker } from '@/components/ContactPicker'
import { InteractionTypePicker } from '@/components/InteractionTypePicker'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createInteraction } from '@/app/actions/interactions'

interface QuickLogSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedContact?: { id: string; name: string; relationshipType: string | null } | null
}

export function QuickLogSheet({ open, onOpenChange, preselectedContact }: QuickLogSheetProps) {
  const router = useRouter()
  const [contact, setContact] = useState(preselectedContact ?? null)
  const [type, setType] = useState('call')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!contact) return
    setSaving(true)
    try {
      await createInteraction({ contactId: contact.id, type, note: note || undefined })
      onOpenChange(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    if (!preselectedContact) setContact(null)
    setType('call')
    setNote('')
  }

  function handleExpand() {
    onOpenChange(false)
    const params = new URLSearchParams()
    if (contact) params.set('contactId', contact.id)
    if (type) params.set('type', type)
    if (note) params.set('note', note)
    router.push(`/log/new?${params.toString()}`)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="focus-visible:outline-none">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-[17px] font-bold">Log Interaction</DrawerTitle>
          </DrawerHeader>

          <div className="px-6 pb-8 space-y-4" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
            {/* Contact */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Who
              </label>
              <ContactPicker value={contact} onChange={setContact} />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Type
              </label>
              <InteractionTypePicker value={type} onChange={setType} />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Note
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened?"
                className="min-h-[44px] resize-none bg-muted/40 border-border/40"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={handleSave}
                disabled={!contact || saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={handleExpand}
                className="text-muted-foreground"
              >
                Expand ↗
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
```

- [ ] **Step 4: Create app group layout**

Create `app/(app)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return <AppShell>{children}</AppShell>
}
```

Create `components/AppShell.tsx` — the client wrapper that manages FAB + sheet state:

```tsx
'use client'

import { useState } from 'react'
import { BottomTabBar } from '@/components/BottomTabBar'
import { Fab } from '@/components/Fab'
import { QuickLogSheet } from '@/components/QuickLogSheet'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <Fab onClick={() => setQuickLogOpen(true)} />
      <BottomTabBar />
      <QuickLogSheet open={quickLogOpen} onOpenChange={setQuickLogOpen} />
    </div>
  )
}
```

- [ ] **Step 5: Update root page to redirect and update metadata**

Replace `app/page.tsx` with:

```tsx
export { default } from './(app)/page'
```

Actually, since we're using a route group `(app)`, the root `/` route lives at `app/(app)/page.tsx`. We need to delete `app/page.tsx` — the route group handles `/` directly.

Delete `app/page.tsx` (we'll create the Today view in `app/(app)/page.tsx` in the next task).

Update `app/layout.tsx` metadata:

```typescript
export const metadata: Metadata = {
  title: 'Reach — Personal CRM',
  description: 'Stay in touch with the people who matter',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Reach',
  },
}
```

- [ ] **Step 6: Commit**

```bash
git add components/BottomTabBar.tsx components/Fab.tsx components/QuickLogSheet.tsx components/AppShell.tsx app/\(app\)/layout.tsx app/layout.tsx
git rm app/page.tsx
git commit -m "feat: add app shell with bottom tab bar, FAB, and quick-log sheet"
```

---

## Task 8: Today View

**Files:**
- Create: `app/(app)/page.tsx`

- [ ] **Step 1: Create the Today page**

Create `app/(app)/page.tsx`:

```tsx
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getTodayReminders, getWeekReminders } from '@/lib/db/queries'
import { TodayList } from './today-list'

export default async function TodayPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [todayItems, weekItems] = await Promise.all([
    getTodayReminders(session.user.id),
    getWeekReminders(session.user.id),
  ])

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const overdue = todayItems.filter((r) => r.reminder.dueDate < today)
  const dueToday = todayItems.filter((r) => r.reminder.dueDate >= today)

  return (
    <TodayList overdue={overdue} dueToday={dueToday} thisWeek={weekItems} />
  )
}
```

Create `app/(app)/today-list.tsx`:

```tsx
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
        ? `${item.reminder.title ?? item.reminder.type === 'recurring' ? 'Check in' : 'Reminder'} at ${item.reminder.time}`
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
            <p className="text-muted-foreground text-sm">You're all caught up!</p>
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
```

- [ ] **Step 2: Verify the page renders**

Run:
```bash
npm run dev
```

Navigate to `http://localhost:3000`. You should see the Today view with the tab bar at the bottom and the FAB. Since there are no contacts yet, it should show the empty state "You're all caught up!".

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/page.tsx app/\(app\)/today-list.tsx
git commit -m "feat: add Today view with overdue/today/week reminder list"
```

---

## Task 9: People List Page

**Files:**
- Create: `app/(app)/people/page.tsx`
- Create: `app/(app)/people/people-list.tsx`
- Create: `components/ContactCard.tsx`

- [ ] **Step 1: Create ContactCard component**

Create `components/ContactCard.tsx`:

```tsx
import Link from 'next/link'
import { TagChip } from '@/components/TagChip'

interface ContactCardProps {
  id: string
  name: string
  relationshipType: string | null
  lastInteractionDate?: Date | null
  tags?: { name: string; color: string | null }[]
}

export function ContactCard({ id, name, relationshipType, lastInteractionDate, tags }: ContactCardProps) {
  const initial = name[0].toUpperCase()

  return (
    <Link
      href={`/people/${id}`}
      className="flex items-center gap-3 px-4 py-3 active:bg-muted/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-semibold text-foreground truncate">{name}</p>
          {relationshipType && (
            <span className="text-[11px] text-muted-foreground">{relationshipType}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {lastInteractionDate && (
            <span className="text-[12px] text-muted-foreground">
              Last: {lastInteractionDate.toLocaleDateString()}
            </span>
          )}
          {tags?.slice(0, 2).map((tag) => (
            <TagChip key={tag.name} name={tag.name} color={tag.color ?? undefined} />
          ))}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create People page (server component)**

Create `app/(app)/people/page.tsx`:

```tsx
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getContacts, getTagsForUser } from '@/lib/db/queries'
import { PeopleList } from './people-list'

export default async function PeoplePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [contacts, userTags] = await Promise.all([
    getContacts(session.user.id),
    getTagsForUser(session.user.id),
  ])

  return <PeopleList contacts={contacts} tags={userTags} />
}
```

- [ ] **Step 3: Create PeopleList client component**

Create `app/(app)/people/people-list.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ContactCard } from '@/components/ContactCard'
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'

interface Contact {
  id: string
  name: string
  phone: string | null
  email: string | null
  relationshipType: string | null
  createdAt: Date
}

interface Tag {
  id: string
  name: string
  color: string | null
}

interface PeopleListProps {
  contacts: Contact[]
  tags: Tag[]
}

export function PeopleList({ contacts, tags }: PeopleListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeTagIds, setActiveTagIds] = useState<string[]>([])

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  // Group alphabetically
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, contact) => {
    const letter = contact.name[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(contact)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  return (
    <PullToRefreshWrapper onRefresh={() => router.refresh()}>
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <h1 className="text-[22px] font-bold text-foreground">People</h1>
            <Link
              href="/people/new"
              className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4 text-primary" />
            </Link>
          </div>

          {/* Search */}
          <div className="pb-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="pl-9 bg-muted/40 border-border/40 h-9"
            />
          </div>

          {/* Tag filter chips */}
          {tags.length > 0 && (
            <div className="pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              {tags.map((tag) => {
                const active = activeTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() =>
                      setActiveTagIds((prev) =>
                        active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                      )
                    }
                    className={[
                      'text-[12px] px-3 py-1 rounded-full whitespace-nowrap transition-all',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 border border-border/40 text-muted-foreground',
                    ].join(' ')}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {letters.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-muted-foreground text-sm">
              {search ? 'No contacts found' : 'No contacts yet'}
            </p>
            {!search && (
              <Link
                href="/people/new"
                className="inline-block mt-4 text-sm text-primary font-medium"
              >
                Add your first contact
              </Link>
            )}
          </div>
        ) : (
          letters.map((letter) => (
            <div key={letter}>
              <div className="sticky top-[120px] z-10 bg-background/90 backdrop-blur-sm px-4 py-1">
                <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase">
                  {letter}
                </span>
              </div>
              {grouped[letter].map((contact) => (
                <ContactCard
                  key={contact.id}
                  id={contact.id}
                  name={contact.name}
                  relationshipType={contact.relationshipType}
                />
              ))}
            </div>
          ))
        )}
      </main>
    </PullToRefreshWrapper>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ContactCard.tsx app/\(app\)/people/page.tsx app/\(app\)/people/people-list.tsx
git commit -m "feat: add People list page with search and alphabetical grouping"
```

---

## Task 10: New Contact Page

**Files:**
- Create: `app/(app)/people/new/page.tsx`

- [ ] **Step 1: Create the new contact form**

Create `app/(app)/people/new/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createContact } from '@/app/actions/contacts'

export default function NewContactPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [birthday, setBirthday] = useState('')
  const [location, setLocation] = useState('')
  const [howWeMet, setHowWeMet] = useState('')
  const [relationshipType, setRelationshipType] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const contact = await createContact({
        name: name.trim(),
        phone: phone || undefined,
        email: email || undefined,
        birthday: birthday || undefined,
        location: location || undefined,
        howWeMet: howWeMet || undefined,
        relationshipType: relationshipType || undefined,
        notes: notes || undefined,
      })
      router.push(`/people/${contact.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-[17px] font-bold">New Contact</h1>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Name — always visible */}
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
            Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name"
            autoFocus
            className="bg-muted/40 border-border/40"
          />
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm text-primary font-medium"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Show less' : 'Add more details'}
        </button>

        {expanded && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Phone
              </label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" className="bg-muted/40 border-border/40" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Email
              </label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="bg-muted/40 border-border/40" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Birthday
              </label>
              <Input value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="e.g. June 15" className="bg-muted/40 border-border/40" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Location
              </label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, state" className="bg-muted/40 border-border/40" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Relationship
              </label>
              <Input value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} placeholder="e.g. close friend, mentor, colleague" className="bg-muted/40 border-border/40" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                How we met
              </label>
              <Input value={howWeMet} onChange={(e) => setHowWeMet(e.target.value)} placeholder="e.g. React Conf 2025" className="bg-muted/40 border-border/40" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Notes
              </label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember..." rows={3} className="bg-muted/40 border-border/40 resize-none" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/people/new/page.tsx
git commit -m "feat: add new contact page with progressive disclosure"
```

---

## Task 11: Contact Profile Page

**Files:**
- Create: `app/(app)/people/[id]/page.tsx`
- Create: `app/(app)/people/[id]/profile-view.tsx`
- Create: `components/InteractionItem.tsx`
- Create: `components/ReminderItem.tsx`
- Create: `components/AddReminderSheet.tsx`

- [ ] **Step 1: Create InteractionItem component**

Create `components/InteractionItem.tsx`:

```tsx
import { interactionIcon } from '@/components/InteractionTypePicker'
import { moodEmoji } from '@/components/MoodPicker'
import { format } from 'date-fns'

interface InteractionItemProps {
  type: string
  note: string | null
  details: string | null
  mood: string | null
  date: Date
  topics: string[] | null
}

export function InteractionItem({ type, note, details, mood, date, topics }: InteractionItemProps) {
  return (
    <div className="px-4 py-3 border-b border-border/30">
      <div className="flex gap-2 items-start">
        <span className="text-sm mt-0.5">{interactionIcon(type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium capitalize">{type.replace('-', ' ')}</p>
          {note && <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{note}</p>}
          {details && <p className="text-[12px] text-muted-foreground/70 mt-1 leading-relaxed">{details}</p>}
          {topics && topics.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {topics.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-muted-foreground/50">{format(date, 'MMM d')}</span>
            {mood && <span className="text-[11px] text-muted-foreground/50">· {moodEmoji(mood)} {mood}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ReminderItem component**

Create `components/ReminderItem.tsx`:

```tsx
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
```

- [ ] **Step 3: Create AddReminderSheet**

Create `components/AddReminderSheet.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createReminder } from '@/app/actions/reminders'

interface AddReminderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
}

export function AddReminderSheet({ open, onOpenChange, contactId }: AddReminderSheetProps) {
  const [type, setType] = useState<'recurring' | 'one-off'>('recurring')
  const [frequencyDays, setFrequencyDays] = useState('14')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const due = dueDate ? new Date(dueDate) : new Date()
      if (type === 'recurring' && !dueDate) {
        due.setDate(due.getDate() + parseInt(frequencyDays || '14'))
      }

      await createReminder({
        contactId,
        type,
        frequencyDays: type === 'recurring' ? parseInt(frequencyDays || '14') : undefined,
        dueDate: due,
        time: time || undefined,
        title: title || undefined,
      })
      onOpenChange(false)
      setTitle('')
      setDueDate('')
      setTime('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="focus-visible:outline-none">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-[17px] font-bold">Add Reminder</DrawerTitle>
          </DrawerHeader>

          <div className="px-6 pb-8 space-y-4" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
            {/* Type */}
            <div className="flex gap-2">
              <button
                onClick={() => setType('recurring')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'recurring' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 border border-border/40 text-muted-foreground'}`}
              >
                Recurring
              </button>
              <button
                onClick={() => setType('one-off')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'one-off' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 border border-border/40 text-muted-foreground'}`}
              >
                One-off
              </button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Birthday call, Catch up" className="bg-muted/40 border-border/40" />
            </div>

            {/* Frequency (recurring only) */}
            {type === 'recurring' && (
              <div className="space-y-1.5">
                <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Every (days)</label>
                <Input value={frequencyDays} onChange={(e) => setFrequencyDays(e.target.value)} type="number" min="1" className="bg-muted/40 border-border/40" />
              </div>
            )}

            {/* Due date */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                {type === 'recurring' ? 'First due date' : 'Due date'}
              </label>
              <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="bg-muted/40 border-border/40" />
            </div>

            {/* Time (optional) */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Time (optional)</label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="bg-muted/40 border-border/40" />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Add Reminder'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
```

- [ ] **Step 4: Create contact profile server component**

Create `app/(app)/people/[id]/page.tsx`:

```tsx
export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import {
  getContact,
  getTagsForContact,
  getInteractionsForContact,
  getRemindersForContact,
  getAttachmentsForContact,
} from '@/lib/db/queries'
import { ProfileView } from './profile-view'

export default async function ContactProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const contact = await getContact(session.user.id, id)
  if (!contact) notFound()

  const [contactTags, contactInteractions, contactReminders, contactAttachments] = await Promise.all([
    getTagsForContact(id),
    getInteractionsForContact(id),
    getRemindersForContact(id),
    getAttachmentsForContact(id),
  ])

  return (
    <ProfileView
      contact={contact}
      tags={contactTags}
      interactions={contactInteractions}
      reminders={contactReminders}
      attachments={contactAttachments}
    />
  )
}
```

- [ ] **Step 5: Create ProfileView client component**

Create `app/(app)/people/[id]/profile-view.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, Bell } from 'lucide-react'
import { TagChip } from '@/components/TagChip'
import { InteractionItem } from '@/components/InteractionItem'
import { ReminderItem } from '@/components/ReminderItem'
import { AddReminderSheet } from '@/components/AddReminderSheet'
import { QuickLogSheet } from '@/components/QuickLogSheet'
import { deleteContact } from '@/app/actions/contacts'

interface ProfileViewProps {
  contact: {
    id: string
    name: string
    phone: string | null
    email: string | null
    birthday: string | null
    location: string | null
    howWeMet: string | null
    relationshipType: string | null
    notes: string | null
    photoUrl: string | null
  }
  tags: { id: string; name: string; color: string | null }[]
  interactions: {
    id: string
    type: string
    note: string | null
    details: string | null
    mood: string | null
    date: Date
    topics: string[] | null
  }[]
  reminders: {
    id: string
    title: string | null
    type: string
    dueDate: Date
    frequencyDays: number | null
    time: string | null
  }[]
  attachments: { id: string; fileName: string; url: string; mimeType: string }[]
}

export function ProfileView({ contact, tags, interactions, reminders, attachments }: ProfileViewProps) {
  const router = useRouter()
  const [reminderSheetOpen, setReminderSheetOpen] = useState(false)
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  const initial = contact.name[0].toUpperCase()

  async function handleDelete() {
    if (!confirm(`Delete ${contact.name}? This cannot be undone.`)) return
    await deleteContact(contact.id)
    router.push('/people')
  }

  const details = [
    { label: 'Phone', value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : null },
    { label: 'Email', value: contact.email, href: contact.email ? `mailto:${contact.email}` : null },
    { label: 'Birthday', value: contact.birthday, href: null },
    { label: 'Location', value: contact.location, href: null },
    { label: 'How we met', value: contact.howWeMet, href: null },
  ].filter((d) => d.value)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex gap-2">
            <Link
              href={`/people/${contact.id}/edit`}
              className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
            <button
              onClick={handleDelete}
              className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Avatar + Name */}
        <div className="py-6 text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-2xl font-semibold text-primary mx-auto mb-3">
            {initial}
          </div>
          <h1 className="text-[22px] font-bold">{contact.name}</h1>
          {contact.relationshipType && (
            <p className="text-[14px] text-muted-foreground mt-0.5">{contact.relationshipType}</p>
          )}
          {tags.length > 0 && (
            <div className="flex gap-1.5 justify-center mt-2 flex-wrap">
              {tags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color ?? undefined} />
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex justify-center gap-6 pb-6">
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="text-center">
              <div className="w-11 h-11 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-lg mx-auto">📞</div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Call</span>
            </a>
          )}
          {contact.phone && (
            <a href={`sms:${contact.phone}`} className="text-center">
              <div className="w-11 h-11 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-lg mx-auto">💬</div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Text</span>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-center">
              <div className="w-11 h-11 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-lg mx-auto">✉️</div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Email</span>
            </a>
          )}
          <button onClick={() => setQuickLogOpen(true)} className="text-center">
            <div className="w-11 h-11 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-lg mx-auto">📝</div>
            <span className="text-[11px] text-muted-foreground mt-1 block">Log</span>
          </button>
        </div>

        {/* Reminders */}
        <section className="mb-6">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
              Reminders
            </h2>
            <button
              onClick={() => setReminderSheetOpen(true)}
              className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center"
            >
              <Bell className="w-3 h-3 text-primary" />
            </button>
          </div>
          {reminders.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground/50">No reminders set</p>
          ) : (
            reminders.map((r) => (
              <ReminderItem
                key={r.id}
                id={r.id}
                title={r.title}
                type={r.type}
                dueDate={r.dueDate}
                frequencyDays={r.frequencyDays}
                time={r.time}
              />
            ))
          )}
        </section>

        {/* Timeline */}
        <section className="mb-6">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-4 mb-2">
            Timeline
          </h2>
          {interactions.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground/50">No interactions yet</p>
          ) : (
            interactions.map((i) => (
              <InteractionItem
                key={i.id}
                type={i.type}
                note={i.note}
                details={i.details}
                mood={i.mood}
                date={i.date}
                topics={i.topics}
              />
            ))
          )}
        </section>

        {/* Notes */}
        {contact.notes && (
          <section className="mb-6 px-4">
            <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
              Notes
            </h2>
            <div className="bg-muted/30 border border-border/30 rounded-xl p-4 text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {contact.notes}
            </div>
          </section>
        )}

        {/* Details */}
        {details.length > 0 && (
          <section className="mb-6 px-4">
            <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
              Details
            </h2>
            <div className="bg-muted/30 border border-border/30 rounded-xl overflow-hidden">
              {details.map((d, i) => (
                <div key={d.label} className={`flex justify-between px-4 py-2.5 ${i < details.length - 1 ? 'border-b border-border/30' : ''}`}>
                  <span className="text-[13px] text-muted-foreground/60">{d.label}</span>
                  {d.href ? (
                    <a href={d.href} className="text-[13px] text-primary">{d.value}</a>
                  ) : (
                    <span className="text-[13px]">{d.value}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attachments */}
        <section className="mb-6 px-4">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
            Attachments
          </h2>
          <div className="flex gap-2 flex-wrap">
            {attachments.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-2xl"
              >
                {a.mimeType.startsWith('image/') ? '🖼️' : '📄'}
              </a>
            ))}
          </div>
        </section>
      </main>

      <AddReminderSheet
        open={reminderSheetOpen}
        onOpenChange={setReminderSheetOpen}
        contactId={contact.id}
      />
      <QuickLogSheet
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        preselectedContact={{ id: contact.id, name: contact.name, relationshipType: contact.relationshipType }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/InteractionItem.tsx components/ReminderItem.tsx components/AddReminderSheet.tsx app/\(app\)/people/\[id\]/page.tsx app/\(app\)/people/\[id\]/profile-view.tsx
git commit -m "feat: add contact profile page with timeline, reminders, and details"
```

---

## Task 12: Edit Contact Page

**Files:**
- Create: `app/(app)/people/[id]/edit/page.tsx`

- [ ] **Step 1: Create edit contact page**

Create `app/(app)/people/[id]/edit/page.tsx`:

```tsx
export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getContact, getTagsForContact } from '@/lib/db/queries'
import { EditContactForm } from './edit-form'

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const contact = await getContact(session.user.id, id)
  if (!contact) notFound()

  const contactTags = await getTagsForContact(id)

  return <EditContactForm contact={contact} tags={contactTags} />
}
```

Create `app/(app)/people/[id]/edit/edit-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateContact } from '@/app/actions/contacts'

interface EditContactFormProps {
  contact: {
    id: string
    name: string
    phone: string | null
    email: string | null
    birthday: string | null
    location: string | null
    howWeMet: string | null
    relationshipType: string | null
    notes: string | null
  }
  tags: { id: string; name: string; color: string | null }[]
}

export function EditContactForm({ contact, tags }: EditContactFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(contact.name)
  const [phone, setPhone] = useState(contact.phone ?? '')
  const [email, setEmail] = useState(contact.email ?? '')
  const [birthday, setBirthday] = useState(contact.birthday ?? '')
  const [location, setLocation] = useState(contact.location ?? '')
  const [howWeMet, setHowWeMet] = useState(contact.howWeMet ?? '')
  const [relationshipType, setRelationshipType] = useState(contact.relationshipType ?? '')
  const [notes, setNotes] = useState(contact.notes ?? '')

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateContact(contact.id, {
        name: name.trim(),
        phone: phone || undefined,
        email: email || undefined,
        birthday: birthday || undefined,
        location: location || undefined,
        howWeMet: howWeMet || undefined,
        relationshipType: relationshipType || undefined,
        notes: notes || undefined,
      })
      router.push(`/people/${contact.id}`)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { label: 'Name *', value: name, set: setName, type: 'text', placeholder: 'Contact name' },
    { label: 'Phone', value: phone, set: setPhone, type: 'tel', placeholder: 'Phone number' },
    { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'Email' },
    { label: 'Birthday', value: birthday, set: setBirthday, type: 'text', placeholder: 'e.g. June 15' },
    { label: 'Location', value: location, set: setLocation, type: 'text', placeholder: 'City, state' },
    { label: 'Relationship', value: relationshipType, set: setRelationshipType, type: 'text', placeholder: 'e.g. close friend, mentor' },
    { label: 'How we met', value: howWeMet, set: setHowWeMet, type: 'text', placeholder: 'e.g. React Conf 2025' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-[17px] font-bold">Edit Contact</h1>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {fields.map((f) => (
          <div key={f.label} className="space-y-1.5">
            <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
              {f.label}
            </label>
            <Input
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              type={f.type}
              placeholder={f.placeholder}
              className="bg-muted/40 border-border/40"
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
            Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to remember..."
            rows={4}
            className="bg-muted/40 border-border/40 resize-none"
          />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/people/\[id\]/edit/page.tsx app/\(app\)/people/\[id\]/edit/edit-form.tsx
git commit -m "feat: add edit contact page"
```

---

## Task 13: Activity Log Page

**Files:**
- Create: `app/(app)/log/page.tsx`
- Create: `app/(app)/log/log-feed.tsx`

- [ ] **Step 1: Create Activity Log server component**

Create `app/(app)/log/page.tsx`:

```tsx
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getAllInteractions } from '@/lib/db/queries'
import { LogFeed } from './log-feed'

export default async function LogPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const items = await getAllInteractions(session.user.id)

  return <LogFeed items={items} />
}
```

- [ ] **Step 2: Create LogFeed client component**

Create `app/(app)/log/log-feed.tsx`:

```tsx
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

  // Group by date
  const grouped = items.reduce<Record<string, LogItem[]>>((acc, item) => {
    const key = format(item.interaction.date, 'yyyy-MM-dd')
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const dateKeys = Object.keys(grouped).sort().reverse()

  return (
    <PullToRefreshWrapper onRefresh={() => router.refresh()}>
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
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
                <Link
                  key={item.interaction.id}
                  href={`/people/${item.interaction.contactId}`}
                  className="flex items-start gap-3 px-4 py-3 border-b border-border/30 active:bg-muted/30 transition-colors"
                >
                  <span className="text-sm mt-0.5">{interactionIcon(item.interaction.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{item.contactName}</span>
                      <span className="text-[12px] text-muted-foreground capitalize">
                        {item.interaction.type.replace('-', ' ')}
                      </span>
                    </div>
                    {item.interaction.note && (
                      <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{item.interaction.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground/50">
                        {format(item.interaction.date, 'h:mm a')}
                      </span>
                      {item.interaction.mood && (
                        <span className="text-[11px]">{moodEmoji(item.interaction.mood)}</span>
                      )}
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
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/log/page.tsx app/\(app\)/log/log-feed.tsx
git commit -m "feat: add Activity Log page with date-grouped feed"
```

---

## Task 14: Expanded Log Page

**Files:**
- Create: `app/(app)/log/new/page.tsx`

- [ ] **Step 1: Create expanded log form page**

Create `app/(app)/log/new/page.tsx`:

```tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ContactPicker } from '@/components/ContactPicker'
import { InteractionTypePicker } from '@/components/InteractionTypePicker'
import { MoodPicker } from '@/components/MoodPicker'
import { TopicInput } from '@/components/TopicInput'
import { createInteraction } from '@/app/actions/interactions'

function LogForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contact, setContact] = useState<{ id: string; name: string; relationshipType: string | null } | null>(null)
  const [type, setType] = useState(searchParams.get('type') ?? 'call')
  const [note, setNote] = useState(searchParams.get('note') ?? '')
  const [details, setDetails] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [mood, setMood] = useState<string | undefined>()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!contact) return
    setSaving(true)
    try {
      await createInteraction({
        contactId: contact.id,
        type,
        note: note || undefined,
        details: details || undefined,
        topics: topics.length ? topics : undefined,
        mood,
        date: new Date(date),
      })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-[17px] font-bold">Log Interaction</h1>
          <Button size="sm" onClick={handleSave} disabled={!contact || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Who</label>
          <ContactPicker value={contact} onChange={setContact} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Type</label>
          <InteractionTypePicker value={type} onChange={setType} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">When</label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} type="datetime-local" className="bg-muted/40 border-border/40" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Note</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened?" rows={2} className="bg-muted/40 border-border/40 resize-none" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Details</label>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Longer notes, context, follow-ups..." rows={3} className="bg-muted/40 border-border/40 resize-none" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Topics</label>
          <TopicInput value={topics} onChange={setTopics} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Mood</label>
          <MoodPicker value={mood} onChange={setMood} />
        </div>
      </main>
    </div>
  )
}

export default function NewLogPage() {
  return (
    <Suspense>
      <LogForm />
    </Suspense>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/log/new/page.tsx
git commit -m "feat: add expanded log form page with full interaction fields"
```

---

## Task 15: Settings Page

**Files:**
- Create: `app/(app)/settings/page.tsx`
- Modify: `components/SettingsSheet.tsx`

- [ ] **Step 1: Create settings page**

Create `app/(app)/settings/page.tsx`:

```tsx
'use client'

import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationPreferences } from '@/components/NotificationPreferences'

const THEMES = [
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
] as const

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  const user = session?.user
  const initial = (user?.name ?? user?.email ?? '?')[0].toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="text-[22px] font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-6" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
          {/* Account */}
          <section className="space-y-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground/55 uppercase tracking-widest px-0.5">
              Account
            </p>
            <div className="flex items-center gap-3 bg-muted/40 border border-border/40 rounded-xl px-4 py-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-sm font-semibold bg-primary/15 text-primary border border-primary/20">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {user?.name && (
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">{user.name}</p>
                )}
                <p className={`text-xs text-muted-foreground truncate ${user?.name ? 'mt-0.5' : ''}`}>
                  {user?.email}
                </p>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="space-y-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground/55 uppercase tracking-widest px-0.5">
              Appearance
            </p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(({ value, label, Icon }) => {
                const active = theme === value
                return (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={[
                      'flex flex-col items-center gap-2.5 py-3.5 px-2 rounded-xl border text-xs font-medium',
                      'transition-all duration-150 active:scale-95',
                      active
                        ? 'bg-primary/12 border-primary/35 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
                        : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    ].join(' ')}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Notifications */}
          <section className="space-y-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground/55 uppercase tracking-widest px-0.5">
              Notifications
            </p>
            <NotificationPreferences />
          </section>

          {/* Sign out */}
          <section>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={[
                'w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium',
                'bg-muted/40 border border-border/40 text-muted-foreground',
                'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/25',
                'transition-all duration-150 active:scale-[0.98]',
              ].join(' ')}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/settings/page.tsx
git commit -m "feat: add Settings page"
```

---

## Task 16: Cron Job — Reminder Notifications

**Files:**
- Modify: `app/api/cron/reminders/route.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Update middleware to allow cron route**

The existing middleware already allows `/api/auth` routes. Verify that `/api/cron` is also allowed — since it's under `/api`, check the matcher. The current matcher excludes static files but includes all other routes. The cron route uses Bearer token auth, not session auth, so it needs to bypass the session check.

Update `middleware.ts` — add `/api/cron` to the bypass list:

```typescript
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')
  const isApiCron = req.nextUrl.pathname.startsWith('/api/cron')

  if (isApiAuth || isApiCron) return

  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL('/', req.nextUrl))
  }
})
```

- [ ] **Step 2: Implement the cron route**

Replace `app/api/cron/reminders/route.ts` with:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reminders, contacts, notificationPreferences, users } from '@/lib/db/schema'
import { eq, and, lte, sql } from 'drizzle-orm'
import { sendPushToUsers } from '@/lib/onesignal'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  // Get all users with their notification preferences
  const allUsers = await db.select().from(users)

  for (const user of allUsers) {
    // Get notification preferences
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id))
      .limit(1)

    const digestEnabled = prefs?.digestEnabled ?? true
    const remindersEnabled = prefs?.remindersEnabled ?? true

    if (!digestEnabled && !remindersEnabled) continue

    // Get due reminders for this user
    const dueReminders = await db
      .select({
        reminder: reminders,
        contactName: contacts.name,
      })
      .from(reminders)
      .innerJoin(contacts, eq(reminders.contactId, contacts.id))
      .where(
        and(
          eq(reminders.userId, user.id),
          eq(reminders.completed, false),
          lte(reminders.dueDate, endOfDay),
        ),
      )

    if (dueReminders.length === 0) continue

    // Send morning digest
    if (digestEnabled) {
      const count = dueReminders.length
      await sendPushToUsers(
        [user.id],
        'Reach — Today',
        `You have ${count} ${count === 1 ? 'person' : 'people'} to reach out to today`,
        '/',
      )
    }

    // Send individual reminders for one-off reminders with a specific time
    if (remindersEnabled) {
      for (const { reminder, contactName } of dueReminders) {
        if (reminder.type === 'one-off' && reminder.time) {
          await sendPushToUsers(
            [user.id],
            'Reminder',
            `${reminder.title ?? contactName}${reminder.time ? ` at ${reminder.time}` : ''}`,
            `/people/${reminder.contactId}`,
          )
        }
      }
    }
  }

  return NextResponse.json({ ok: true, timestamp: now.toISOString() })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/reminders/route.ts middleware.ts
git commit -m "feat: implement cron job for digest and individual reminder notifications"
```

---

## Task 17: Final Wiring & Cleanup

**Files:**
- Delete: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Remove old page.tsx**

Delete `app/page.tsx` since the route group `(app)` now handles `/`:

```bash
rm app/page.tsx
```

- [ ] **Step 2: Update app metadata**

In `app/layout.tsx`, update the metadata title and description:

Change the metadata export to:
```typescript
export const metadata: Metadata = {
  title: 'Reach — Personal CRM',
  description: 'Stay in touch with the people who matter',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Reach',
  },
}
```

- [ ] **Step 3: Verify the app builds**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire up app shell, clean up old boilerplate page, update metadata"
```

---

## Task 18: Smoke Test

- [ ] **Step 1: Start dev server and test**

Run:
```bash
npm run dev
```

Test the following flows manually:

1. Navigate to `http://localhost:3000` — should show Today view with empty state
2. Tap People tab — should show empty contacts list
3. Tap + to add a contact — should show new contact form
4. Create a contact with just a name — should redirect to profile
5. On profile, tap Log — should open quick log sheet
6. Log an interaction — should appear in timeline
7. Add a reminder from the profile — should appear in reminders section
8. Navigate to Log tab — should show the logged interaction
9. Navigate to Settings — should show account, theme, notifications

- [ ] **Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: smoke test fixes"
```
