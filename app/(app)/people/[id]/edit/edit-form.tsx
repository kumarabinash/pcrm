'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateContact } from '@/app/actions/contacts'

interface EditContactFormProps {
  contact: {
    id: string
    name: string
    phone: string | null
    email: string | null
    birthday: string | null
    location: string | null
    howWeMet: string | null
    relationshipType: string | null
    notes: string | null
  }
  tags: { id: string; name: string; color: string | null }[]
}

export function EditContactForm({ contact, tags }: EditContactFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(contact.name)
  const [phone, setPhone] = useState(contact.phone ?? '')
  const [email, setEmail] = useState(contact.email ?? '')
  const [birthday, setBirthday] = useState(contact.birthday ?? '')
  const [location, setLocation] = useState(contact.location ?? '')
  const [howWeMet, setHowWeMet] = useState(contact.howWeMet ?? '')
  const [relationshipType, setRelationshipType] = useState(contact.relationshipType ?? '')
  const [notes, setNotes] = useState(contact.notes ?? '')

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateContact(contact.id, {
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
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { label: 'Name *', value: name, set: setName, type: 'text', placeholder: 'Contact name' },
    { label: 'Phone', value: phone, set: setPhone, type: 'tel', placeholder: 'Phone number' },
    { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'Email' },
    { label: 'Birthday', value: birthday, set: setBirthday, type: 'text', placeholder: 'e.g. June 15' },
    { label: 'Location', value: location, set: setLocation, type: 'text', placeholder: 'City, state' },
    { label: 'Relationship', value: relationshipType, set: setRelationshipType, type: 'text', placeholder: 'e.g. close friend, mentor' },
    { label: 'How we met', value: howWeMet, set: setHowWeMet, type: 'text', placeholder: 'e.g. React Conf 2025' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-[17px] font-bold">Edit Contact</h1>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {fields.map((f) => (
          <div key={f.label} className="space-y-1.5">
            <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">{f.label}</label>
            <Input value={f.value} onChange={(e) => f.set(e.target.value)} type={f.type} placeholder={f.placeholder} className="bg-muted/40 border-border/40" />
          </div>
        ))}
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember..." rows={4} className="bg-muted/40 border-border/40 resize-none" />
        </div>
      </main>
    </div>
  )
}
