'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import OneSignal from 'react-onesignal'

export function OneSignalInit() {
  const { data: session } = useSession()
  const initialised = useRef(false)
  const initPromise = useRef<Promise<void> | null>(null)

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    initPromise.current = OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
      serviceWorkerParam: { scope: '/' },
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      // notifyButton is disabled by default; passing enable:false triggers a type
      // error because the type requires all sub-fields even when disabled.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notifyButton: { enable: false } as any,
      allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
    })
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    const userId = session.user.id
    const doLogin = () => OneSignal.login(userId).catch(() => {})
    if (initPromise.current) {
      initPromise.current.then(doLogin).catch(() => {})
    } else {
      doLogin()
    }
  }, [session?.user?.id])

  return null
}
