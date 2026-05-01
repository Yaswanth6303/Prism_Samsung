type Provider = 'claude' | 'openai' | 'gemini'

type ResponseContent = {
  type?: string
  text?: string
}

type ResponseOutput = {
  type?: string
  content?: ResponseContent[]
}

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

function extractText(payload: { output?: ResponseOutput[] }) {
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('\n')
    .trim()
}

export async function callAI(provider: Provider, prompt: string) {
  if (provider !== 'openai' || !process.env.OPENAI_API_KEY) {
    return fallbackNotes(prompt)
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      instructions: 'Create concise, student-friendly markdown notes with summary, key points, and review prompts.',
      input: prompt,
    }),
  })

  if (!response.ok) {
    return fallbackNotes(prompt)
  }

  const payload = await response.json() as { output?: ResponseOutput[] }
  return extractText(payload) || fallbackNotes(prompt)
}
