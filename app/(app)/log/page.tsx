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
