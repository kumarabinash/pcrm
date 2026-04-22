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
