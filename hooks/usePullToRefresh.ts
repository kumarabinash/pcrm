'use client'

import { useRef, useState, useCallback, useEffect, RefObject } from 'react'
import { useMotionValue, useTransform, animate, MotionValue } from 'framer-motion'

const THRESHOLD = 80   // px pull distance to trigger refresh
const DAMPING = 0.3    // rubber-band factor past threshold
const REFRESH_HEIGHT = 48  // px the indicator holds at while refreshing

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  disabledRef?: RefObject<boolean>
}

export interface UsePullToRefreshReturn {
  indicatorHeight: MotionValue<number>
  pullProgress: MotionValue<number>
  refreshing: boolean
  isReleased: boolean
}

export function usePullToRefresh({
  onRefresh,
  disabledRef,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const indicatorHeight = useMotionValue(0)
  const pullProgress = useTransform(indicatorHeight, [0, THRESHOLD], [0, 1], { clamp: true })

  const [refreshing, setRefreshing] = useState(false)
  const [isReleased, setIsReleased] = useState(false)

  const startY = useRef(0)
  const isPulling = useRef(false)
  const refreshingRef = useRef(false)

  const springTo = useCallback((target: number) => {
    animate(indicatorHeight, target, { type: 'spring', stiffness: 300, damping: 30 })
  }, [indicatorHeight])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return
      if (disabledRef?.current) return
      if (window.scrollY > 0) return
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return
      if (disabledRef?.current) {
        isPulling.current = false
        springTo(0)
        return
      }

      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        isPulling.current = false
        springTo(0)
        return
      }

      // Rubber-band: damped past threshold
      const damped = delta < THRESHOLD
        ? delta
        : THRESHOLD + (delta - THRESHOLD) * DAMPING

      indicatorHeight.set(damped)

      // Prevent native scroll bounce while pulling
      if (delta > 5) e.preventDefault()
    }

    const handleTouchCancel = () => {
      if (!isPulling.current) return
      isPulling.current = false
      springTo(0)
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current) return
      isPulling.current = false

      const height = indicatorHeight.get()

      if (height >= THRESHOLD) {
        setIsReleased(true)
        animate(indicatorHeight, REFRESH_HEIGHT, { type: 'spring', stiffness: 300, damping: 30 })

        if ('vibrate' in navigator) navigator.vibrate(10)

        setRefreshing(true)
        refreshingRef.current = true
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          refreshingRef.current = false
          setIsReleased(false)
          springTo(0)
        }
      } else {
        springTo(0)
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [onRefresh, disabledRef, indicatorHeight, springTo])

  return { indicatorHeight, pullProgress, refreshing, isReleased }
}
