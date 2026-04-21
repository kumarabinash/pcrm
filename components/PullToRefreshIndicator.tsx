'use client'

import { motion, useTransform, MotionValue } from 'framer-motion'

const R = 11
const CIRCUMFERENCE = 2 * Math.PI * R  // ≈ 69.115

interface PullToRefreshIndicatorProps {
  pullProgress: MotionValue<number>
  refreshing: boolean
  isReleased: boolean
}

export function PullToRefreshIndicator({
  pullProgress,
  refreshing,
  isReleased,
}: PullToRefreshIndicatorProps) {
  // strokeDashoffset: CIRCUMFERENCE (no arc) → 0 (full arc)
  const strokeDashoffset = useTransform(pullProgress, [0, 1], [CIRCUMFERENCE, 0])

  const isSpinning = isReleased || refreshing

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      {/* Track ring */}
      <circle
        cx="16" cy="16" r={R}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="2.5"
      />

      {/* Pull arc (fills as user pulls) */}
      {!isSpinning && (
        <motion.circle
          cx="16" cy="16" r={R}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeDasharray={CIRCUMFERENCE}
          style={{
            strokeDashoffset,
            transformOrigin: '16px 16px',
            rotate: -90,
          }}
          strokeLinecap="round"
        />
      )}

      {/* Spinning arc (shown after release + during refresh) */}
      {isSpinning && (
        <motion.g
          style={{ transformOrigin: '16px 16px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="16" cy="16" r={R}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * 0.5}
            strokeLinecap="round"
          />
        </motion.g>
      )}
    </svg>
  )
}
