"use client"

import { useState } from 'react'

export function ClawMind() {
  const [messages, setMessages] = useState<{from: string; text: string}[]>([])
  const [text, setText] = useState('')

  async function send() {
    if (!text) return
    setMessages(m => [...m, { from: 'you', text }])
    try {
      const res = await fetch('/api/clawmind', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text }) })
      if (!res.ok) throw new Error('bad')
      const j = await res.json()
      if (j?.ok) setMessages(m => [...m, { from: 'clawmind', text: j.reply }])
    } catch {
      setMessages(m => [...m, { from: 'clawmind', text: 'Error: could not reach ClawMind' }])
    }
    setText('')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">ClawMind</h2>
      <div className="space-y-2 mb-3">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.from === 'you' ? 'bg-blue-50' : 'bg-gray-100'}`}>
            <div className="text-sm">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} className="flex-1 px-3 py-2 border rounded" placeholder="Ask ClawMind..." />
        <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  )
}
