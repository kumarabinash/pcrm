'use client'

import { useState, useEffect } from 'react'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { searchContactsAction } from '@/app/actions/contacts'

interface Contact {
  id: string
  name: string
  relationshipType: string | null
}

interface ContactPickerProps {
  value?: Contact | null
  onChange: (contact: Contact) => void
}

export function ContactPicker({ value, onChange }: ContactPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contact[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      const contacts = await searchContactsAction(query)
      setResults(contacts)
    }, 200)
    return () => clearTimeout(timeout)
  }, [query])

  if (value && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3.5 py-3 text-left flex items-center gap-2.5"
      >
        <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
          {value.name[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium">{value.name}</span>
      </button>
    )
  }

  return (
    <Command className="rounded-xl border border-border/40 bg-muted/40" shouldFilter={false}>
      <CommandInput
        placeholder="Search contacts..."
        value={query}
        onValueChange={setQuery}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <CommandList>
          <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
            {query ? 'No contacts found' : 'Type to search'}
          </CommandEmpty>
          {results.map((contact) => (
            <CommandItem
              key={contact.id}
              onSelect={() => {
                onChange(contact)
                setOpen(false)
                setQuery('')
              }}
              className="flex items-center gap-2.5 px-3 py-2"
            >
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
                {contact.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{contact.name}</p>
                {contact.relationshipType && (
                  <p className="text-xs text-muted-foreground">{contact.relationshipType}</p>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandList>
      )}
    </Command>
  )
}
