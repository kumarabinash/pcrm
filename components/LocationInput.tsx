'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

interface Suggestion {
  id: string
  name: string
  place: string
  lat: number
  lng: number
}

interface LocationInputProps {
  value: string
  onChange: (value: string) => void
  onSelect: (result: { name: string; lat: number; lng: number }) => void
  placeholder?: string
  className?: string
}

export default function LocationInput({
  value, onChange, onSelect, placeholder, className,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedRef      = useRef(false)
  const justSelectedRef = useRef(false)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); setOpen(false); return }
    const geoCodeMapToken = process.env.NEXT_PUBLIC_GEO_CODING_API_TOKEN
    const geocodeMapsUrl = `https://geocode.maps.co/search?q=${encodeURIComponent(query)}&api_key=${geoCodeMapToken}&accept-language=en`
    try {
      const res  = await fetch(geocodeMapsUrl)
      if (!res.ok) return
      const data = await res.json()
      const results: Suggestion[] = (data ?? []).map((f: {
        place_id: number;
        name: string;
        lat: string;
        lon: string;
        address: {
          state: string;
          country: string;
          postcode: string;
        };
      }) => ({
        id:    f.place_id,
        name:  `${f.name}`,
        place: [f.address.state, f.address.country, f.address.postcode].filter(Boolean).join(', '),
        lat:   f.lat,
        lng:   f.lon,
      }))
      setSuggestions(results)
      setOpen(results.length > 0)
    } catch {
      setSuggestions([])
    }
  }, [])

  useEffect(() => {
    if (justSelectedRef.current) { justSelectedRef.current = false; return }
    if (!focusedRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, fetchSuggestions])

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={e => {
          onChange(e.target.value)
          if (!e.target.value) { setSuggestions([]); setOpen(false) }
        }}
        onFocus={() => { focusedRef.current = true }}
        onBlur={() => { focusedRef.current = false; setOpen(false) }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.id}
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                justSelectedRef.current = true
                onChange(s.name)
                onSelect({ name: s.name, lat: s.lat, lng: s.lng })
                setSuggestions([])
                setOpen(false)
              }}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.place}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
