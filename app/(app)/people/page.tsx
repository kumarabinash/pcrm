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
