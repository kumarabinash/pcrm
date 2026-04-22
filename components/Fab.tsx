'use client'

import { Plus } from 'lucide-react'

interface FabProps {
  onClick: () => void
}

export function Fab({ onClick }: FabProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'fixed z-30 w-[52px] h-[52px] rounded-full',
        'bg-primary text-primary-foreground',
        'flex items-center justify-center',
        'shadow-lg shadow-primary/25',
        'transition-all duration-150 active:scale-90',
      ].join(' ')}
      style={{
        bottom: 'calc(80px + env(safe-area-inset-bottom))',
        right: '16px',
      }}
    >
      <Plus className="w-6 h-6" />
    </button>
  )
}
