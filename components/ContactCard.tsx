import Link from 'next/link'
import { TagChip } from '@/components/TagChip'

interface ContactCardProps {
  id: string
  name: string
  relationshipType: string | null
  lastInteractionDate?: Date | null
  tags?: { name: string; color: string | null }[]
}

export function ContactCard({ id, name, relationshipType, lastInteractionDate, tags }: ContactCardProps) {
  const initial = name[0].toUpperCase()

  return (
    <Link
      href={`/people/${id}`}
      className="flex items-center gap-3 px-4 py-3 active:bg-muted/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-semibold text-foreground truncate">{name}</p>
          {relationshipType && (
            <span className="text-[11px] text-muted-foreground">{relationshipType}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {lastInteractionDate && (
            <span className="text-[12px] text-muted-foreground">
              Last: {lastInteractionDate.toLocaleDateString()}
            </span>
          )}
          {tags?.slice(0, 2).map((tag) => (
            <TagChip key={tag.name} name={tag.name} color={tag.color ?? undefined} />
          ))}
        </div>
      </div>
    </Link>
  )
}
