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
