import { z } from 'zod'

export type Provider = 'claude' | 'openai' | 'gemini'

// Schemas for each external provider's response shape. Only the fields we actually consume are required.
const OpenAIResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string() }).optional(),
      }),
    )
    .optional(),
})

const ClaudeResponseSchema = z.object({
  content: z
    .array(
      z.object({ type: z.string().optional(), text: z.string().optional() }),
    )
    .optional(),
})

const GeminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z
          .object({
            parts: z.array(z.object({ text: z.string().optional() })).optional(),
          })
          .optional(),
      }),
    )
    .optional(),
})

// Error envelope shared by all three providers — we extract whatever we can find.
const ErrorEnvelopeSchema = z
  .object({ error: z.object({ message: z.string().optional() }).optional() })
  .passthrough()

async function safeErrorMessage(response: Response, label: string): Promise<string> {
  try {
    const raw: unknown = await response.json()
    const parsed = ErrorEnvelopeSchema.safeParse(raw)
    if (parsed.success && parsed.data.error?.message) {
      return `${label} Error: ${parsed.data.error.message}`
    }
  } catch {
    // fall through to status-only message
  }
  return `${label} Error: ${response.statusText}`
}

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
export async function callAI(
  provider: Provider,
  prompt: string,
  apiKey?: string,
  instruction?: string,
): Promise<string> {
  if (!apiKey) {
    return fallbackNotes(prompt)
  }

  // Keep the system message short and student-friendly unless the caller overrides it.
  const sysInstruction =
    instruction || 'Create concise, student-friendly markdown notes with summary, key points, and review prompts.'

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
            { role: 'user', content: prompt },
          ],
        }),
      })
      if (!response.ok) {
        throw new Error(await safeErrorMessage(response, 'OpenAI'))
      }
      const raw: unknown = await response.json()
      const parsed = OpenAIResponseSchema.safeParse(raw)
      const content = parsed.success ? parsed.data.choices?.[0]?.message?.content : undefined
      return content ?? fallbackNotes(prompt)
    }

    if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1500,
          system: sysInstruction,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!response.ok) {
        throw new Error(await safeErrorMessage(response, 'Claude'))
      }
      const raw: unknown = await response.json()
      const parsed = ClaudeResponseSchema.safeParse(raw)
      const text = parsed.success ? parsed.data.content?.[0]?.text : undefined
      return text ?? fallbackNotes(prompt)
    }

    if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sysInstruction }] },
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      )
      if (!response.ok) {
        throw new Error(await safeErrorMessage(response, 'Gemini'))
      }
      const raw: unknown = await response.json()
      const parsed = GeminiResponseSchema.safeParse(raw)
      const text = parsed.success
        ? parsed.data.candidates?.[0]?.content?.parts?.[0]?.text
        : undefined
      return text ?? fallbackNotes(prompt)
    }
  } catch (error) {
    // Bubble the error up so the caller can show the failure instead of pretending the request succeeded.
    console.error('AI call failed:', error)
    throw error
  }

  return fallbackNotes(prompt)
}
