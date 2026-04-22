'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, Bell } from 'lucide-react'
import { TagChip } from '@/components/TagChip'
import { InteractionItem } from '@/components/InteractionItem'
import { ReminderItem } from '@/components/ReminderItem'
import { AddReminderSheet } from '@/components/AddReminderSheet'
import { QuickLogSheet } from '@/components/QuickLogSheet'
import { deleteContact } from '@/app/actions/contacts'

interface ProfileViewProps {
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
    photoUrl: string | null
  }
  tags: { id: string; name: string; color: string | null }[]
  interactions: {
    id: string
    type: string
    note: string | null
    details: string | null
    mood: string | null
    date: Date
    topics: string[] | null
  }[]
  reminders: {
    id: string
    title: string | null
    type: string
    dueDate: Date
    frequencyDays: number | null
    time: string | null
  }[]
  attachments: { id: string; fileName: string; url: string; mimeType: string }[]
}

export function ProfileView({ contact, tags, interactions, reminders, attachments }: ProfileViewProps) {
  const router = useRouter()
  const [reminderSheetOpen, setReminderSheetOpen] = useState(false)
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  const initial = contact.name[0].toUpperCase()

  async function handleDelete() {
    if (!confirm(`Delete ${contact.name}? This cannot be undone.`)) return
    await deleteContact(contact.id)
    router.push('/people')
  }

  const details = [
    { label: 'Phone', value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : null },
    { label: 'Email', value: contact.email, href: contact.email ? `mailto:${contact.email}` : null },
    { label: 'Birthday', value: contact.birthday, href: null },
    { label: 'Location', value: contact.location, href: null },
    { label: 'How we met', value: contact.howWeMet, href: null },
  ].filter((d) => d.value)

  return (
    <div className="min-h-screen bg-background pb-24">
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex gap-2">
            <Link
              href={`/people/${contact.id}/edit`}
              className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
            <button
              onClick={handleDelete}
              className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        <div className="py-6 text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-2xl font-semibold text-primary mx-auto mb-3">
            {initial}
          </div>
          <h1 className="text-[22px] font-bold">{contact.name}</h1>
          {contact.relationshipType && (
            <p className="text-[14px] text-muted-foreground mt-0.5">{contact.relationshipType}</p>
          )}
          {tags.length > 0 && (
            <div className="flex gap-1.5 justify-center mt-2 flex-wrap">
              {tags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color ?? undefined} />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-6 pb-6">
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="text-center">
              <div className="w-11 h-11 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-lg mx-auto">📞</div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Call</span>
            </a>
          )}
          {contact.phone && (
            <a href={`sms:${contact.phone}`} className="text-center">
              <div className="w-11 h-11 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-lg mx-auto">💬</div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Text</span>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-center">
              <div className="w-11 h-11 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-lg mx-auto">✉️</div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Email</span>
            </a>
          )}
          <button onClick={() => setQuickLogOpen(true)} className="text-center">
            <div className="w-11 h-11 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-lg mx-auto">📝</div>
            <span className="text-[11px] text-muted-foreground mt-1 block">Log</span>
          </button>
        </div>

        <section className="mb-6">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Reminders</h2>
            <button onClick={() => setReminderSheetOpen(true)} className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <Bell className="w-3 h-3 text-primary" />
            </button>
          </div>
          {reminders.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground/50">No reminders set</p>
          ) : (
            reminders.map((r) => (
              <ReminderItem key={r.id} id={r.id} title={r.title} type={r.type} dueDate={r.dueDate} frequencyDays={r.frequencyDays} time={r.time} />
            ))
          )}
        </section>

        <section className="mb-6">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-4 mb-2">Timeline</h2>
          {interactions.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground/50">No interactions yet</p>
          ) : (
            interactions.map((i) => (
              <InteractionItem key={i.id} type={i.type} note={i.note} details={i.details} mood={i.mood} date={i.date} topics={i.topics} />
            ))
          )}
        </section>

        {contact.notes && (
          <section className="mb-6 px-4">
            <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Notes</h2>
            <div className="bg-muted/30 border border-border/30 rounded-xl p-4 text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {contact.notes}
            </div>
          </section>
        )}

        {details.length > 0 && (
          <section className="mb-6 px-4">
            <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Details</h2>
            <div className="bg-muted/30 border border-border/30 rounded-xl overflow-hidden">
              {details.map((d, i) => (
                <div key={d.label} className={`flex justify-between px-4 py-2.5 ${i < details.length - 1 ? 'border-b border-border/30' : ''}`}>
                  <span className="text-[13px] text-muted-foreground/60">{d.label}</span>
                  {d.href ? (
                    <a href={d.href} className="text-[13px] text-primary">{d.value}</a>
                  ) : (
                    <span className="text-[13px]">{d.value}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-6 px-4">
          <h2 className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">Attachments</h2>
          <div className="flex gap-2 flex-wrap">
            {attachments.map((a) => (
              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-2xl">
                {a.mimeType.startsWith('image/') ? '🖼️' : '📄'}
              </a>
            ))}
          </div>
        </section>
      </main>

      <AddReminderSheet open={reminderSheetOpen} onOpenChange={setReminderSheetOpen} contactId={contact.id} />
      <QuickLogSheet open={quickLogOpen} onOpenChange={setQuickLogOpen} preselectedContact={{ id: contact.id, name: contact.name, relationshipType: contact.relationshipType }} />
    </div>
  )
}
