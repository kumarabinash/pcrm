'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createContact } from '@/app/actions/contacts'

export default function NewContactPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [birthday, setBirthday] = useState('')
  const [location, setLocation] = useState('')
  const [howWeMet, setHowWeMet] = useState('')
  const [relationshipType, setRelationshipType] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const contact = await createContact({
        name: name.trim(),
        phone: phone || undefined,
        email: email || undefined,
        birthday: birthday || undefined,
        location: location || undefined,
        howWeMet: howWeMet || undefined,
        relationshipType: relationshipType || undefined,
        notes: notes || undefined,
      })
      router.push(`/people/${contact.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-[17px] font-bold">New Contact</h1>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
            Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name"
            autoFocus
            className="bg-muted/40 border-border/40"
          />
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm text-primary font-medium"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Show less' : 'Add more details'}
        </button>

        {expanded && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" className="bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Birthday</label>
              <Input value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="e.g. June 15" className="bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, state" className="bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Relationship</label>
              <Input value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} placeholder="e.g. close friend, mentor, colleague" className="bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">How we met</label>
              <Input value={howWeMet} onChange={(e) => setHowWeMet(e.target.value)} placeholder="e.g. React Conf 2025" className="bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember..." rows={3} className="bg-muted/40 border-border/40 resize-none" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
