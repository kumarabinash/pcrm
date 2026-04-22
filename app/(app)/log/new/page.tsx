'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ContactPicker } from '@/components/ContactPicker'
import { InteractionTypePicker } from '@/components/InteractionTypePicker'
import { MoodPicker } from '@/components/MoodPicker'
import { TopicInput } from '@/components/TopicInput'
import { createInteraction } from '@/app/actions/interactions'

function LogForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contact, setContact] = useState<{ id: string; name: string; relationshipType: string | null } | null>(null)
  const [type, setType] = useState(searchParams.get('type') ?? 'call')
  const [note, setNote] = useState(searchParams.get('note') ?? '')
  const [details, setDetails] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [mood, setMood] = useState<string | undefined>()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!contact) return
    setSaving(true)
    try {
      await createInteraction({
        contactId: contact.id,
        type,
        note: note || undefined,
        details: details || undefined,
        topics: topics.length ? topics : undefined,
        mood,
        date: new Date(date),
      })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-[17px] font-bold">Log Interaction</h1>
          <Button size="sm" onClick={handleSave} disabled={!contact || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Who</label>
          <ContactPicker value={contact} onChange={setContact} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Type</label>
          <InteractionTypePicker value={type} onChange={setType} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">When</label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} type="datetime-local" className="bg-muted/40 border-border/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Note</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened?" rows={2} className="bg-muted/40 border-border/40 resize-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Details</label>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Longer notes, context, follow-ups..." rows={3} className="bg-muted/40 border-border/40 resize-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Topics</label>
          <TopicInput value={topics} onChange={setTopics} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Mood</label>
          <MoodPicker value={mood} onChange={setMood} />
        </div>
      </main>
    </div>
  )
}

export default function NewLogPage() {
  return (
    <Suspense>
      <LogForm />
    </Suspense>
  )
}
