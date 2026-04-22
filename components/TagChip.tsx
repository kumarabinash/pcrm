interface TagChipProps {
  name: string
  color?: string
  onRemove?: () => void
}

const DEFAULT_COLORS: Record<string, string> = {
  family: '#ef4444',
  work: '#a855f7',
  gym: '#3b82f6',
  college: '#a855f7',
  networking: '#3b82f6',
  mentor: '#22c55e',
  tech: '#3b82f6',
}

export function TagChip({ name, color, onRemove }: TagChipProps) {
  const c = color ?? DEFAULT_COLORS[name.toLowerCase()] ?? '#6b7280'

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: `${c}15`, color: c }}
    >
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70">
          ×
        </button>
      )}
    </span>
  )
}
