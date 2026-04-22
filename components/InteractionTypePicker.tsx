'use client'

const TYPES = [
  { value: 'call', label: 'Call', icon: '📞' },
  { value: 'text', label: 'Text', icon: '💬' },
  { value: 'in-person', label: 'In person', icon: '🤝' },
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'other', label: 'Other', icon: '📌' },
] as const

export type InteractionType = (typeof TYPES)[number]['value']

export function interactionIcon(type: string) {
  return TYPES.find((t) => t.value === type)?.icon ?? '📌'
}

interface InteractionTypePickerProps {
  value: string
  onChange: (value: string) => void
}

export function InteractionTypePicker({ value, onChange }: InteractionTypePickerProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={[
            'text-[13px] px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95',
            value === t.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/40 border border-border/40 text-muted-foreground hover:bg-muted/70',
          ].join(' ')}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}
