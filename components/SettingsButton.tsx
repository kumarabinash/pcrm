'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import SettingsSheet from '@/components/SettingsSheet'

export default function SettingsButton() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const user = session?.user
  const initial = user ? (user.name ?? user.email ?? '?')[0].toUpperCase() : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full transition-all hover:ring-2 hover:ring-primary/30 hover:ring-offset-1 hover:ring-offset-background active:scale-95"
        aria-label="Settings"
      >
        <Avatar className="h-7 w-7">
          <AvatarImage src={user?.image ?? undefined} />
          <AvatarFallback className="text-[11px] font-semibold bg-primary/15 text-primary border border-primary/20">
            {initial ?? '·'}
          </AvatarFallback>
        </Avatar>
      </button>

      <SettingsSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
