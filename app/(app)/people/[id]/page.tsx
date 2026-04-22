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
