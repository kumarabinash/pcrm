'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createReminder } from '@/app/actions/reminders'

interface AddReminderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
}

export function AddReminderSheet({ open, onOpenChange, contactId }: AddReminderSheetProps) {
  const [type, setType] = useState<'recurring' | 'one-off'>('recurring')
  const [frequencyDays, setFrequencyDays] = useState('14')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const due = dueDate ? new Date(dueDate) : new Date()
      if (type === 'recurring' && !dueDate) {
        due.setDate(due.getDate() + parseInt(frequencyDays || '14'))
      }

      await createReminder({
        contactId,
        type,
        frequencyDays: type === 'recurring' ? parseInt(frequencyDays || '14') : undefined,
        dueDate: due,
        time: time || undefined,
        title: title || undefined,
      })
      onOpenChange(false)
      setTitle('')
      setDueDate('')
      setTime('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="focus-visible:outline-none">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-[17px] font-bold">Add Reminder</DrawerTitle>
          </DrawerHeader>

          <div className="px-6 pb-8 space-y-4" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
            <div className="flex gap-2">
              <button
                onClick={() => setType('recurring')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'recurring' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 border border-border/40 text-muted-foreground'}`}
              >
                Recurring
              </button>
              <button
                onClick={() => setType('one-off')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'one-off' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 border border-border/40 text-muted-foreground'}`}
              >
                One-off
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Birthday call, Catch up" className="bg-muted/40 border-border/40" />
            </div>

            {type === 'recurring' && (
              <div className="space-y-1.5">
                <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Every (days)</label>
                <Input value={frequencyDays} onChange={(e) => setFrequencyDays(e.target.value)} type="number" min="1" className="bg-muted/40 border-border/40" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">
                {type === 'recurring' ? 'First due date' : 'Due date'}
              </label>
              <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="bg-muted/40 border-border/40" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wide font-semibold">Time (optional)</label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="bg-muted/40 border-border/40" />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Add Reminder'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
