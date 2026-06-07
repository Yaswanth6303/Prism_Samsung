import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth/server'
import { type INote, Subject } from '@/lib/db/models/Subject'
import { User } from '@/lib/db/models/User'
import connectToDB from '@/lib/db/mongoose'
import { callAI } from '@/lib/integrations/ai-client'
import { decrypt } from '@/lib/services/encryption'
import { NoteCreateBodySchema, NoteDeleteBodySchema } from '@/types/api'

function serializeNote(note: INote, subjectId: string) {
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
  const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id })
    .lean<{ _id: { toString(): string }; notes?: INote[] } | null>()
  if (!subject) {
    return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
  }

  const subjectIdStr = subject._id.toString()
  return NextResponse.json({
    ok: true,
    notes: (subject.notes ?? []).map((note) => serializeNote(note, subjectIdStr)),
  })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = NoteCreateBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
    }
    const { subjectId, title, text, provider = 'openai' } = parsed.data

    await connectToDB()
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'user not found' }, { status: 404 })
    }

    let apiKey = ''
    if (provider === 'openai' && user.openaiKey) {apiKey = decrypt(user.openaiKey)}
    if (provider === 'claude' && user.anthropicKey) {apiKey = decrypt(user.anthropicKey)}
    if (provider === 'gemini' && user.geminiKey) {apiKey = decrypt(user.geminiKey)}

    const sourceText = text || title
    const prompt = `You are an expert educational tutor. The student has provided the following syllabus, topic, or source material:

${sourceText}

Please generate extremely detailed, comprehensive study notes on this topic. Include:
- A high-level summary or overview.
- Deep, detailed explanations of core concepts.
- Practical examples where applicable.
- Key takeaways for revision.
Format your response entirely in clean, readable Markdown.`
    const content = await callAI(
      provider,
      prompt,
      apiKey,
      'You are an expert AI tutor. Generate comprehensive and detailed study materials.',
    )

    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id })
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }

    subject.notes.push({
      title,
      content,
      createdDate: new Date(),
      hasQuiz: false,
    })
    await subject.save()

    const note = subject.notes[subject.notes.length - 1]
    return NextResponse.json({ ok: true, note: serializeNote(note, subject._id.toString()) })
  } catch (error) {
    console.error('Note Generation Error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = NoteDeleteBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
    }
    const { subjectId, noteId } = parsed.data

    await connectToDB()
    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id })
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }

    const originalCount = subject.notes.length
    subject.notes = subject.notes.filter((note) => note._id?.toString() !== noteId) as typeof subject.notes
    if (subject.notes.length === originalCount) {
      return NextResponse.json({ ok: false, error: 'note not found' }, { status: 404 })
    }

    await subject.save()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Note Delete Error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
