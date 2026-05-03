import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { callAI } from '@/lib/aiClient'
import connectToDB from '@/lib/mongodb'
import { Subject } from '@/lib/models/Subject'
import { User } from '@/lib/models/User'
import { decrypt } from '@/lib/encryption'

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
  const session = await auth.api.getSession({ headers: await headers() })
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
  const session = await auth.api.getSession({ headers: await headers() })
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

    await connectToDB()
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'user not found' }, { status: 404 })
    }

    let apiKey = ''
    if (provider === 'openai' && user.openaiKey) apiKey = decrypt(user.openaiKey)
    if (provider === 'claude' && user.anthropicKey) apiKey = decrypt(user.anthropicKey)
    if (provider === 'gemini' && user.geminiKey) apiKey = decrypt(user.geminiKey)

    const sourceText = body.text || body.content || body.title
    const prompt = `You are an expert educational tutor. The student has provided the following syllabus, topic, or source material:

${sourceText}

Please generate extremely detailed, comprehensive study notes on this topic. Include:
- A high-level summary or overview.
- Deep, detailed explanations of core concepts.
- Practical examples where applicable.
- Key takeaways for revision.
Format your response entirely in clean, readable Markdown.`
    const content = await callAI(provider, prompt, apiKey, 'You are an expert AI tutor. Generate comprehensive and detailed study materials.')

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
  } catch (error: any) {
    console.error('Note Generation Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const subjectId = body.subjectId || body.directoryId
    const noteId = body.noteId

    if (!subjectId || !noteId) {
      return NextResponse.json({ ok: false, error: 'subjectId and noteId are required' }, { status: 400 })
    }

    await connectToDB()
    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id })
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }

    const originalCount = subject.notes.length
    subject.notes = subject.notes.filter((note) => note._id?.toString() !== noteId)
    if (subject.notes.length === originalCount) {
      return NextResponse.json({ ok: false, error: 'note not found' }, { status: 404 })
    }

    await subject.save()
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Note Delete Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 500 })
  }
}
