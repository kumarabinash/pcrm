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
