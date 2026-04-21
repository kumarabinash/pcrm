const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!
const REST_KEY = process.env.ONESIGNAL_REST_API_KEY!

/**
 * Send a push notification to one or more users by their app userId (external_id).
 * Fire-and-forget — logs errors but does not throw.
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  url = '/',
): Promise<void> {
  if (userIds.length === 0) return
  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: APP_ID,
        include_external_user_ids: userIds,
        target_channel: 'push',
        headings: { en: title },
        contents: { en: body },
        url,
      }),
    })
    if (!res.ok) {
      console.error('[OneSignal] send failed', res.status, await res.text())
    }
  } catch (err) {
    console.error('[OneSignal] send error', err)
  }
}
