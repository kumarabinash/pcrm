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
