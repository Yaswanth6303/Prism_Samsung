import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { callAI } from '@/lib/aiClient'
import connectToDB from '@/lib/mongodb'
import { Subject } from '@/lib/models/Subject'

type NoteRecord = {
  _id?: { toString(): string }
  title: string
  content?: string
  createdDate?: Date
  hasQuiz?: boolean
  quiz?: unknown[]
}

function serializeNote(note: NoteRecord, subjectId: string) {
  return {
    id: note._id?.toString() ?? '',
    subjectId,
    title: note.title,
    content: note.content || '',
    createdDate: note.createdDate ? new Date(note.createdDate).toISOString().slice(0, 10) : '',
    hasQuiz: Boolean(note.hasQuiz),
    quiz: note.quiz ?? [],
  }
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subjectId = searchParams.get('subjectId') || searchParams.get('directoryId')
  if (!subjectId) {
    return NextResponse.json({ ok: false, error: 'subjectId is required' }, { status: 400 })
  }

  await connectToDB()
  const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id }).lean()
  if (!subject) {
    return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, notes: (subject.notes ?? []).map((note) => serializeNote(note, subject._id.toString())) })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const subjectId = body.subjectId || body.directoryId
    const provider = (body.provider || 'openai') as 'claude' | 'openai' | 'gemini'

    if (!subjectId || !body.title) {
      return NextResponse.json({ ok: false, error: 'subjectId and title are required' }, { status: 400 })
    }

    const sourceText = body.text || body.content || body.title
    const prompt = `Create clean markdown notes for:\n${sourceText}`
    const content = await callAI(provider, prompt)

    await connectToDB()
    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id })
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }

    subject.notes.push({
      title: body.title,
      content,
      createdDate: new Date(),
      hasQuiz: false,
    })
    await subject.save()

    const note = subject.notes[subject.notes.length - 1]
    return NextResponse.json({ ok: true, note: serializeNote(note, subject._id.toString()) })
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid request body' }, { status: 400 })
  }
}
