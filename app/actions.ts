'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { attachments, notificationPreferences } from '@/lib/db/schema'
import { generateUploadUrl, deleteStorageObject, getPublicUrl } from '@/lib/storage'
import { eq } from 'drizzle-orm'

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireAuth(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

// ── Attachments ───────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export async function getUploadUrl(
  fileName: string,
  mimeType: string,
): Promise<{ uploadUrl: string; storageKey: string; publicUrl: string }> {
  const userId = await requireAuth()

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  const ext = MIME_TO_EXT[mimeType]
  const storageKey = `attachments/${userId}/${crypto.randomUUID()}.${ext}`
  const uploadUrl = await generateUploadUrl(storageKey, mimeType)
  const publicUrl = getPublicUrl(storageKey)
  return { uploadUrl, storageKey, publicUrl }
}

export async function addAttachment(
  data: {
    fileName: string
    mimeType: string
    fileSize: number
    storageKey: string
  },
): Promise<{ id: string; uploadedBy: string | null; createdAt: string }> {
  const userId = await requireAuth()
  const url = getPublicUrl(data.storageKey)
  const [row] = await db
    .insert(attachments)
    .values({ ...data, url, uploadedBy: userId })
    .returning({ id: attachments.id, uploadedBy: attachments.uploadedBy, createdAt: attachments.createdAt })
  return {
    id: row.id,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  const userId = await requireAuth()

  const [row] = await db
    .select({ storageKey: attachments.storageKey, uploadedBy: attachments.uploadedBy })
    .from(attachments)
    .where(eq(attachments.id, attachmentId))
    .limit(1)

  if (!row) return
  if (row.uploadedBy !== userId) throw new Error('Forbidden')

  await db.delete(attachments).where(eq(attachments.id, attachmentId))
  await deleteStorageObject(row.storageKey)
}

// ── Notification preferences ──────────────────────────────────────────────────

export async function updateNotificationPreferences(prefs: {
  onEventCreated: boolean
  onEventDeleted: boolean
  onEventEdited: boolean
  onCommentAdded: boolean
  onStatusChanged: boolean
}): Promise<void> {
  const userId = await requireAuth()

  await db
    .insert(notificationPreferences)
    .values({ userId, ...prefs })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: prefs,
    })
}

export async function getNotificationPreferences(): Promise<{
  onEventCreated: boolean
  onEventDeleted: boolean
  onEventEdited: boolean
  onCommentAdded: boolean
  onStatusChanged: boolean
}> {
  const userId = await requireAuth()

  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1)

  return row ?? {
    onEventCreated: true,
    onEventDeleted: true,
    onEventEdited: false,
    onCommentAdded: true,
    onStatusChanged: false,
  }
}
