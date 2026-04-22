'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { contacts, contactTags } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { searchContacts } from '@/lib/db/queries'

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

export async function searchContactsAction(query: string) {
  const userId = await requireAuth()
  return searchContacts(userId, query)
}
