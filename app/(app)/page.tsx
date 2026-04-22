export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getTodayReminders, getWeekReminders } from '@/lib/db/queries'
import { TodayList } from './today-list'

export default async function TodayPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [todayItems, weekItems] = await Promise.all([
    getTodayReminders(session.user.id),
    getWeekReminders(session.user.id),
  ])

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const overdue = todayItems.filter((r) => r.reminder.dueDate < today)
  const dueToday = todayItems.filter((r) => r.reminder.dueDate >= today)

  return (
    <TodayList overdue={overdue} dueToday={dueToday} thisWeek={weekItems} />
  )
}
