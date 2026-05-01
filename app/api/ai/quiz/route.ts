import { NextResponse } from 'next/server'
import { createQuizFromNote } from '@/lib/feature-store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = body.userId || 'demo-user'

    if (!body.noteId) {
      return NextResponse.json({ ok: false, error: 'noteId is required' }, { status: 400 })
    }

    const quiz = createQuizFromNote({ userId, noteId: body.noteId })
    if (!quiz) {
      return NextResponse.json({ ok: false, error: 'note not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, quiz })
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid request body' }, { status: 400 })
  }
}
