'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevPathname = useRef(pathname)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    setProgress(100)
    setVisible(true)

    timeoutRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setProgress(0), 300)
    }, 300)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [pathname])

  if (progress === 0 && !visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className="h-full bg-primary transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '300ms' : '0ms',
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  )
}
