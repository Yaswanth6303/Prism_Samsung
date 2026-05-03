import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { callAI } from '@/lib/aiClient'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json({ ok: false, error: 'message required' }, { status: 400 })
  }

  const reply = await callAI('openai', `Answer as ClawMind, a concise study assistant. Keep it practical.\n${message}`)
  return NextResponse.json({ ok: true, reply })
}
