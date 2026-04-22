'use client'

import { useState } from 'react'

interface TopicInputProps {
  value: string[]
  onChange: (topics: string[]) => void
}

export function TopicInput({ value, onChange }: TopicInputProps) {
  const [input, setInput] = useState('')

  function addTopic() {
    const topic = input.trim().toLowerCase()
    if (topic && !value.includes(topic)) {
      onChange([...value, topic])
    }
    setInput('')
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {value.map((topic) => (
        <span
          key={topic}
          className="inline-flex items-center gap-1 text-[12px] px-3 py-1 rounded-full bg-muted/60 border border-border/40"
        >
          {topic}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== topic))}
            className="hover:opacity-70"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addTopic()
          }
        }}
        onBlur={addTopic}
        placeholder="+ add topic"
        className="text-[12px] px-3 py-1 rounded-full bg-muted/30 border border-border/30 outline-none w-24 placeholder:text-muted-foreground/40"
      />
    </div>
  )
}
