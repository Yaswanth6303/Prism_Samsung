import { NextResponse } from 'next/server'
import { callAI } from '@/lib/aiClient'
import { createNote, listNotes } from '@/lib/feature-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || 'demo-user'
  return NextResponse.json({ ok: true, notes: listNotes(userId) })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = body.userId || 'demo-user'
    const provider = (body.provider || 'openai') as 'claude' | 'openai' | 'gemini'

    if (!body.title) {
      return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 })
    }

    const sourceText = body.text || ''
    const prompt = `Create clean markdown notes for:\n${sourceText}`
    const content = await callAI(provider, prompt)

    const note = createNote({
      userId,
      directoryId: body.directoryId,
      title: body.title,
      content,
      tags: body.tags,
    })

    return NextResponse.json({ ok: true, note })
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid request body' }, { status: 400 })
  }
}
