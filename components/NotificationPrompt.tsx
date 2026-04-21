'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import OneSignal from 'react-onesignal'

const DISMISSED_KEY = 'app_notif_prompt_dismissed'

export function NotificationPrompt() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return
    // Small delay so the app feels settled before prompting
    const t = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(t)
  }, [session?.user])

  const handleEnable = async () => {
    setShow(false)
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      await OneSignal.User.PushSubscription.optIn()
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-3xl">🔔</span>
          <div>
            <p className="font-semibold text-sm">Stay in the loop</p>
            <p className="text-xs text-muted-foreground mt-1">
              Get notified about important updates and activity.
            </p>
          </div>
          <button
            onClick={handleEnable}
            className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold"
          >
            Enable notifications
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
