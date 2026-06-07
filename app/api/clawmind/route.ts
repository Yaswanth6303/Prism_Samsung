import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth/server'
import { callAI } from '@/lib/integrations/ai-client'
import { ClawMindBodySchema } from '@/types/api'

// ClawMind is a thin prompt wrapper so the client can ask for a focused study response.
export async function POST(request: Request) {
  // AI requests are gated behind auth because the app treats this as a personal assistant.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody: unknown = await request.json()
  const parsed = ClawMindBodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'message required' }, { status: 400 })
  }

  // The system prefix keeps the assistant concise and on-topic for study help.
  const reply = await callAI(
    'openai',
    `Answer as ClawMind, a concise study assistant. Keep it practical.\n${parsed.data.message}`,
  )
  return NextResponse.json({ ok: true, reply })
}
