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
  } else {
    throw new Error('Recurring reminder has no frequency configured')
  }

  revalidatePath(`/people/${existing.contactId}`)
  revalidatePath('/')
  return previousState
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

export async function snoozeReminder(reminderId: string, newDate: Date) {
  const userId = await requireAuth()

  const [existing] = await db
    .select({ id: reminders.id, dueDate: reminders.dueDate, contactId: reminders.contactId })
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1)

  if (!existing) throw new Error('Not found')
  if (newDate <= new Date()) throw new Error('Snooze date must be in the future')

  const previousDueDate = existing.dueDate

  await db
    .update(reminders)
    .set({ dueDate: newDate })
    .where(eq(reminders.id, reminderId))

  revalidatePath(`/people/${existing.contactId}`)
  revalidatePath('/')
  return { previousDueDate, contactId: existing.contactId }
}

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
