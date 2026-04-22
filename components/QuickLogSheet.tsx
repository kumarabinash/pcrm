'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ContactPicker } from '@/components/ContactPicker'
import { InteractionTypePicker } from '@/components/InteractionTypePicker'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createInteraction } from '@/app/actions/interactions'

interface QuickLogSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedContact?: { id: string; name: string; relationshipType: string | null } | null
}

export function QuickLogSheet({ open, onOpenChange, preselectedContact }: QuickLogSheetProps) {
  const router = useRouter()
  const [contact, setContact] = useState(preselectedContact ?? null)
  const [type, setType] = useState('call')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!contact) return
    setSaving(true)
    try {
      await createInteraction({ contactId: contact.id, type, note: note || undefined })
      onOpenChange(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    if (!preselectedContact) setContact(null)
    setType('call')
    setNote('')
  }

  function handleExpand() {
    onOpenChange(false)
    const params = new URLSearchParams()
    if (contact) params.set('contactId', contact.id)
    if (type) params.set('type', type)
    if (note) params.set('note', note)
    router.push(`/log/new?${params.toString()}`)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="focus-visible:outline-none">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-[17px] font-bold">Log Interaction</DrawerTitle>
          </DrawerHeader>

          <div className="px-6 pb-8 space-y-4" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
            {/* Contact */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Who
              </label>
              <ContactPicker value={contact} onChange={setContact} />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Type
              </label>
              <InteractionTypePicker value={type} onChange={setType} />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                Note
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened?"
                className="min-h-[44px] resize-none bg-muted/40 border-border/40"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={handleSave}
                disabled={!contact || saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={handleExpand}
                className="text-muted-foreground"
              >
                Expand ↗
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
