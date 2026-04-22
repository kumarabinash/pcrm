'use client'

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
        'flex items-center justify-center text-2xl font-light',
        'shadow-lg shadow-primary/25',
        'transition-all duration-150 active:scale-90',
      ].join(' ')}
      style={{
        bottom: 'calc(68px + env(safe-area-inset-bottom))',
        right: '16px',
      }}
    >
      +
    </button>
  )
}
