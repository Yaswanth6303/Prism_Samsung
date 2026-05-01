export type Provider = 'claude' | 'openai' | 'gemini'

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

export async function callAI(provider: Provider, prompt: string, apiKey?: string, instruction?: string) {
  if (!apiKey) {
    return fallbackNotes(prompt)
  }

  const sysInstruction = instruction || 'Create concise, student-friendly markdown notes with summary, key points, and review prompts.'

  try {
    if (provider === 'openai') {
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
    console.error('AI call failed:', error)
    throw error // Bubble up the error so the UI shows it instead of failing silently
  }

  return fallbackNotes(prompt)
}
