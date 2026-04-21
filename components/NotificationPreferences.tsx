'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getNotificationPreferences, updateNotificationPreferences } from '@/app/actions'

type Prefs = {
  onEventCreated: boolean
  onEventDeleted: boolean
  onEventEdited: boolean
  onCommentAdded: boolean
  onStatusChanged: boolean
}

const LABELS: { key: keyof Prefs; label: string }[] = [
  { key: 'onEventCreated',  label: 'Event created' },
  { key: 'onEventDeleted',  label: 'Event deleted' },
  { key: 'onEventEdited',   label: 'Event edited' },
  { key: 'onCommentAdded',  label: 'Comment added' },
  { key: 'onStatusChanged', label: 'Status changed' },
]

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Prefs>({
    onEventCreated: true,
    onEventDeleted: true,
    onEventEdited: false,
    onCommentAdded: true,
    onStatusChanged: false,
  })

  useEffect(() => {
    getNotificationPreferences().then(setPrefs).catch(() => {})
  }, [])

  const handleToggle = async (key: keyof Prefs, value: boolean) => {
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    await updateNotificationPreferences(updated)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Notifications
      </p>
      {LABELS.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between">
          <Label className="text-sm">{label}</Label>
          <Switch
            checked={prefs[key]}
            onCheckedChange={val => handleToggle(key, val)}
          />
        </div>
      ))}
    </div>
  )
}
