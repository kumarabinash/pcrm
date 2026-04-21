import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Add your scheduled notification logic here.
  // This route is called by Vercel Cron (see vercel.json).
  // Use `sendPushToUsers` from `@/lib/onesignal` to send notifications.

  return NextResponse.json({ ok: true })
}
