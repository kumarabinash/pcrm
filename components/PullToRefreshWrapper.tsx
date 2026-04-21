'use client'

import { RefObject } from 'react'
import { motion } from 'framer-motion'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator'

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>
  disabledRef?: RefObject<boolean>
  children: React.ReactNode
}

export function PullToRefreshWrapper({
  onRefresh,
  disabledRef,
  children,
}: PullToRefreshWrapperProps) {
  const { indicatorHeight, pullProgress, refreshing, isReleased } =
    usePullToRefresh({ onRefresh, disabledRef })

  return (
    <div>
      <motion.div
        style={{ height: indicatorHeight, overflow: 'hidden' }}
        className="flex items-center justify-center"
        aria-label={refreshing ? 'Refreshing…' : undefined}
        aria-live="polite"
      >
        <span className="sr-only">
          {refreshing ? 'Refreshing content' : isReleased ? 'Release to refresh' : ''}
        </span>
        <PullToRefreshIndicator
          pullProgress={pullProgress}
          refreshing={refreshing}
          isReleased={isReleased}
        />
      </motion.div>
      {children}
    </div>
  )
}
