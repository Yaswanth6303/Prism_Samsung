export type Provider = 'claude' | 'openai' | 'gemini'

// When no API key is available, fall back to a predictable markdown note so the UI still has something useful to show.
function fallbackNotes(prompt: string) {
  const source = prompt.split('\n').slice(1).join('\n').trim()
  const sentences = source.split(/[.!?]\s+/).map((item) => item.trim()).filter(Boolean)
  const bullets = sentences.slice(0, 5).map((item) => `- ${item.replace(/^[-*]\s*/, '')}`)

  return [
    '# Study Notes',
    '',
    '## Summary',
    source ? source.slice(0, 420) : 'Add source material to generate richer notes.',
    '',
    '## Key Points',
    ...(bullets.length > 0 ? bullets : ['- Review the topic, identify definitions, and practice retrieval.']),
    '',
    '## Quick Review',
    '- Explain the topic in your own words.',
    '- Write one example from memory.',
    '- Turn weak areas into quiz questions.',
  ].join('\n')
}

// This helper hides the differences between OpenAI, Claude, and Gemini so the rest of the app can ask for notes once.
export async function callAI(provider: Provider, prompt: string, apiKey?: string, instruction?: string) {
  if (!apiKey) {
    return fallbackNotes(prompt)
  }

  // Keep the system message short and student-friendly unless the caller overrides it.
  const sysInstruction = instruction || 'Create concise, student-friendly markdown notes with summary, key points, and review prompts.'

  try {
    if (provider === 'openai') {
      // OpenAI uses the chat-completions shape, so we format the prompt as system plus user messages.
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: sysInstruction },
            { role: 'user', content: prompt }
          ]
        }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`OpenAI Error: ${error?.error?.message || response.statusText}`)
      }
      const json = await response.json()
      return json.choices?.[0]?.message?.content || fallbackNotes(prompt)
    }

    if (provider === 'claude') {
      // Claude expects the system instruction at the top level and the user content in messages.
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1500,
          system: sysInstruction,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Claude Error: ${error?.error?.message || response.statusText}`)
      }
      const json = await response.json()
      return json.content?.[0]?.text || fallbackNotes(prompt)
    }

    if (provider === 'gemini') {
      // Gemini uses a different request shape, but the app-level prompt stays the same.
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sysInstruction }] },
          contents: [{ parts: [{ text: prompt }] }]
        })
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`Gemini Error: ${error?.error?.message || response.statusText}`)
      }
      const json = await response.json()
      return json.candidates?.[0]?.content?.parts?.[0]?.text || fallbackNotes(prompt)
    }
  } catch (error) {
    // Bubble the error up so the caller can show the failure instead of pretending the request succeeded.
    console.error('AI call failed:', error)
    throw error
  }

  return fallbackNotes(prompt)
}
