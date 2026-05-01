import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { Subject } from '@/lib/models/Subject'

function makeQuiz(content: string) {
  const clean = content.replace(/[#*_`>-]/g, ' ').replace(/\s+/g, ' ').trim()
  const words = clean.split(' ').filter((word) => word.length > 4)
  const topic = words[0] || 'this topic'
  const focus = words[1] || 'concept'

  return [
    {
      question: `What is the main focus of these notes about ${topic}?`,
      options: ['Memorizing unrelated facts', `Understanding ${topic} and related concepts`, 'Skipping practice', 'Only reading examples'],
      correctAnswer: `Understanding ${topic} and related concepts`,
      explanation: 'The notes are meant to help you understand and recall the core concept.',
    },
    {
      question: `Which study action best reinforces ${focus}?`,
      options: ['Explain it from memory', 'Ignore mistakes', 'Avoid examples', 'Read once and stop'],
      correctAnswer: 'Explain it from memory',
      explanation: 'Active recall is stronger than passive rereading.',
    },
    {
      question: 'What should you do after reading generated notes?',
      options: ['Close the app', 'Create review questions', 'Delete the notes', 'Avoid revision'],
      correctAnswer: 'Create review questions',
      explanation: 'Turning notes into questions helps reveal weak areas.',
    },
  ]
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    if (!body.noteId) {
      return NextResponse.json({ ok: false, error: 'noteId is required' }, { status: 400 })
    }

    await connectToDB()
    const subject = await Subject.findOne({ userId: session.user.id, 'notes._id': body.noteId })
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'note not found' }, { status: 404 })
    }

    const note = subject.notes.find((item) => item._id?.toString() === body.noteId)
    if (!note) {
      return NextResponse.json({ ok: false, error: 'note not found' }, { status: 404 })
    }

    note.quiz = makeQuiz(note.content || note.title)
    note.hasQuiz = true
    await subject.save()

    return NextResponse.json({ ok: true, quiz: { noteId: body.noteId, questions: note.quiz } })
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid request body' }, { status: 400 })
  }
}
