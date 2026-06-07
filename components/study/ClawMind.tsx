"use client"

import { useState } from 'react'

import { apiFetch } from '@/lib/api/fetch'
import { ClawMindResponseSchema } from '@/types/api'

// ClawMind is a tiny chat surface for testing the study assistant without leaving the page.
export function ClawMind() {
  const [messages, setMessages] = useState<{from: string; text: string}[]>([])
  const [text, setText] = useState('')

  // Send keeps the prompt/response loop isolated so the rest of the UI stays simple.
  async function send() {
    if (!text) {return}
    setMessages(m => [...m, { from: 'you', text }])
    try {
      const data = await apiFetch('/api/clawmind', ClawMindResponseSchema, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      setMessages(m => [...m, { from: 'clawmind', text: data.reply }])
    } catch {
      setMessages(m => [...m, { from: 'clawmind', text: 'Error: could not reach ClawMind' }])
    }
    setText('')
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">ClawMind</h2>
      {/* Messages are rendered as a simple transcript so the assistant feels conversational without extra chrome. */}
      <div className="space-y-2 mb-3">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.from === 'you' ? 'bg-blue-100/60 dark:bg-blue-900/30' : 'bg-muted'}`}>
            <div className="text-sm">{m.text}</div>
          </div>
        ))}
      </div>
      {/* The input row stays minimal because the value here is in quick, low-friction prompts. */}
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground" placeholder="Ask ClawMind..." />
        <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  )
}
