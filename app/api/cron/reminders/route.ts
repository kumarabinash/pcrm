import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reminders, contacts, notificationPreferences, users } from '@/lib/db/schema'
import { eq, and, lte } from 'drizzle-orm'
import { sendPushToUsers } from '@/lib/onesignal'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const allUsers = await db.select().from(users)

  for (const user of allUsers) {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id))
      .limit(1)

    const digestEnabled = prefs?.digestEnabled ?? true
    const remindersEnabled = prefs?.remindersEnabled ?? true

    if (!digestEnabled && !remindersEnabled) continue

    const dueReminders = await db
      .select({
        reminder: reminders,
        contactName: contacts.name,
      })
      .from(reminders)
      .innerJoin(contacts, eq(reminders.contactId, contacts.id))
      .where(
        and(
          eq(reminders.userId, user.id),
          eq(reminders.completed, false),
          lte(reminders.dueDate, endOfDay),
        ),
      )

    if (dueReminders.length === 0) continue

    if (digestEnabled) {
      const count = dueReminders.length
      await sendPushToUsers(
        [user.id],
        'Reach — Today',
        `You have ${count} ${count === 1 ? 'person' : 'people'} to reach out to today`,
        '/',
      )
    }

    if (remindersEnabled) {
      for (const { reminder, contactName } of dueReminders) {
        if (reminder.type === 'one-off' && reminder.time) {
          await sendPushToUsers(
            [user.id],
            'Reminder',
            `${reminder.title ?? contactName}${reminder.time ? ` at ${reminder.time}` : ''}`,
            `/people/${reminder.contactId}`,
          )
        }
      }
    }
  }

  return NextResponse.json({ ok: true, timestamp: now.toISOString() })
}
