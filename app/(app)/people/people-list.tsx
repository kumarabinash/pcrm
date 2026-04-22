'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ContactCard } from '@/components/ContactCard'
import { PullToRefreshWrapper } from '@/components/PullToRefreshWrapper'

interface Contact {
  id: string
  name: string
  phone: string | null
  email: string | null
  relationshipType: string | null
  createdAt: Date
}

interface Tag {
  id: string
  name: string
  color: string | null
}

interface PeopleListProps {
  contacts: Contact[]
  tags: Tag[]
}

export function PeopleList({ contacts, tags }: PeopleListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeTagIds, setActiveTagIds] = useState<string[]>([])

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  // Group alphabetically
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, contact) => {
    const letter = contact.name[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(contact)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  return (
    <PullToRefreshWrapper onRefresh={async () => { router.refresh() }}>
      <header
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-lg mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <h1 className="text-[22px] font-bold text-foreground">People</h1>
            <Link
              href="/people/new"
              className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4 text-primary" />
            </Link>
          </div>

          {/* Search */}
          <div className="pb-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="pl-9 bg-muted/40 border-border/40 h-9"
            />
          </div>

          {/* Tag filter chips */}
          {tags.length > 0 && (
            <div className="pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              {tags.map((tag) => {
                const active = activeTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() =>
                      setActiveTagIds((prev) =>
                        active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                      )
                    }
                    className={[
                      'text-[12px] px-3 py-1 rounded-full whitespace-nowrap transition-all',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 border border-border/40 text-muted-foreground',
                    ].join(' ')}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {letters.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-muted-foreground text-sm">
              {search ? 'No contacts found' : 'No contacts yet'}
            </p>
            {!search && (
              <Link
                href="/people/new"
                className="inline-block mt-4 text-sm text-primary font-medium"
              >
                Add your first contact
              </Link>
            )}
          </div>
        ) : (
          letters.map((letter) => (
            <div key={letter}>
              <div className="sticky top-[120px] z-10 bg-background/90 backdrop-blur-sm px-4 py-1">
                <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase">
                  {letter}
                </span>
              </div>
              {grouped[letter].map((contact) => (
                <ContactCard
                  key={contact.id}
                  id={contact.id}
                  name={contact.name}
                  relationshipType={contact.relationshipType}
                />
              ))}
            </div>
          ))
        )}
      </main>
    </PullToRefreshWrapper>
  )
}
