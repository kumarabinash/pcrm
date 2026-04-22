'use client'

const MOODS = [
  { value: 'great', emoji: '😊' },
  { value: 'good', emoji: '🙂' },
  { value: 'neutral', emoji: '😐' },
  { value: 'rough', emoji: '😔' },
] as const

export function moodEmoji(mood: string) {
  return MOODS.find((m) => m.value === mood)?.emoji ?? ''
}

interface MoodPickerProps {
  value?: string
  onChange: (value: string | undefined) => void
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="flex gap-2.5">
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(value === m.value ? undefined : m.value)}
          className={[
            'text-2xl p-1.5 rounded-lg transition-all duration-150 active:scale-90',
            value === m.value
              ? 'bg-primary/15 scale-110'
              : 'bg-muted/40 opacity-50 hover:opacity-75',
          ].join(' ')}
        >
          {m.emoji}
        </button>
      ))}
    </div>
  )
}
