import { interactionIcon } from '@/components/InteractionTypePicker'
import { moodEmoji } from '@/components/MoodPicker'
import { format } from 'date-fns'

interface InteractionItemProps {
  type: string
  note: string | null
  details: string | null
  mood: string | null
  date: Date
  topics: string[] | null
}

export function InteractionItem({ type, note, details, mood, date, topics }: InteractionItemProps) {
  return (
    <div className="px-4 py-3 border-b border-border/30">
      <div className="flex gap-2 items-start">
        <span className="text-sm mt-0.5">{interactionIcon(type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium capitalize">{type.replace('-', ' ')}</p>
          {note && <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{note}</p>}
          {details && <p className="text-[12px] text-muted-foreground/70 mt-1 leading-relaxed">{details}</p>}
          {topics && topics.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {topics.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-muted-foreground/50">{format(date, 'MMM d')}</span>
            {mood && <span className="text-[11px] text-muted-foreground/50">· {moodEmoji(mood)} {mood}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
