'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function SplashScreen() {
  const enabled = process.env.NEXT_PUBLIC_SPLASH_ENABLED !== 'false'
  const [visible, setVisible] = useState(true)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    if (!enabled) return

    // Hold for 1.2s, then start fade-out (400ms), then unmount
    const holdTimer = setTimeout(() => setHiding(true), 1200)
    const unmountTimer = setTimeout(() => setVisible(false), 1600)

    return () => {
      clearTimeout(holdTimer)
      clearTimeout(unmountTimer)
    }
  }, [enabled])

  if (!enabled || !visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#060d1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        transition: 'opacity 400ms ease',
        opacity: hiding ? 0 : 1,
      }}
    >
      <Image
        src="/logo.png"
        alt="Percurim"
        width={72}
        height={72}
        priority
        style={{ borderRadius: '16px' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Percurim
        </span>
        <span style={{ color: '#64748b', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Your Personal CRM
        </span>
      </div>
    </div>
  )
}
