import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { Subject } from '@/lib/models/Subject'
import { User } from '@/lib/models/User'
import { callAI } from '@/lib/aiClient'
import { decrypt } from '@/lib/encryption'

function makeQuiz(content: string, count = 8) {
  const clean = content.replace(/[#*_`>-]/g, ' ').replace(/\s+/g, ' ').trim()
  const words = clean.split(' ').filter((word) => word.length > 4)
  const topic = words[0] || 'this topic'
  const focus = words[1] || 'concept'

  const templates = [
    () => ({
      question: `What is the main focus of these notes about ${topic}?`,
      options: ['Memorizing unrelated facts', `Understanding ${topic} and related concepts`, 'Skipping practice', 'Only reading examples'],
      correctAnswer: `Understanding ${topic} and related concepts`,
      explanation: 'The notes are meant to help you understand and recall the core concept.',
    }),
    () => ({
      question: `Which study action best reinforces ${focus}?`,
      options: ['Explain it from memory', 'Ignore mistakes', 'Avoid examples', 'Read once and stop'],
      correctAnswer: 'Explain it from memory',
      explanation: 'Active recall is stronger than passive rereading.',
    }),
    () => ({
      question: `Which of these best summarizes a key idea in ${topic}?`,
      options: [`${topic} relies on core principles and examples`, 'Only memorization matters', 'Practice is unnecessary', 'Skip revision entirely'],
      correctAnswer: `${topic} relies on core principles and examples`,
      explanation: 'Strong understanding comes from principles plus examples.',
    }),
    () => ({
      question: 'What should you do after reading generated notes?',
      options: ['Close the app', 'Create review questions', 'Delete the notes', 'Avoid revision'],
      correctAnswer: 'Create review questions',
      explanation: 'Turning notes into questions helps reveal weak areas.',
    }),
  ]

  const result = [] as Array<{
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
  }>
  for (let i = 0; i < count; i += 1) {
    result.push(templates[i % templates.length]())
  }
  return result
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const noteId = body.noteId
    const subjectId = body.subjectId || body.directoryId
    const count = typeof body.count === 'number' ? Math.max(3, Math.min(20, body.count)) : 8
    if (!noteId && !subjectId) {
      return NextResponse.json({ ok: false, error: 'noteId or subjectId is required' }, { status: 400 })
    }

    const provider = (body.provider || 'openai') as 'claude' | 'openai' | 'gemini'

    await connectToDB()
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'user not found' }, { status: 404 })
    }

    let apiKey = ''
    if (provider === 'openai' && user.openaiKey) apiKey = decrypt(user.openaiKey)
    if (provider === 'claude' && user.anthropicKey) apiKey = decrypt(user.anthropicKey)
    if (provider === 'gemini' && user.geminiKey) apiKey = decrypt(user.geminiKey)

    let subject = null
    let quizSource = ''

    if (noteId) {
      subject = await Subject.findOne({ userId: session.user.id, 'notes._id': noteId })
      if (!subject) {
        return NextResponse.json({ ok: false, error: 'note not found' }, { status: 404 })
      }

      const note = subject.notes.find((item) => item._id?.toString() === noteId)
      if (!note) {
        return NextResponse.json({ ok: false, error: 'note not found' }, { status: 404 })
      }

      quizSource = note.content || note.title
    } else if (subjectId) {
      subject = await Subject.findOne({ _id: subjectId, userId: session.user.id })
      if (!subject) {
        return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
      }

      const notes = subject.notes || []
      if (notes.length === 0) {
        return NextResponse.json({ ok: false, error: 'no notes available' }, { status: 400 })
      }

      quizSource = notes.map((note) => note.content || note.title).join('\n\n')
    }

    let generatedQuiz = null
    if (apiKey) {
      const prompt = `Generate a ${count}-question multiple choice quiz based on these notes:\n${quizSource}\nReturn ONLY a JSON array of objects with keys: question, options (array of 4 strings), correctAnswer (string), explanation (string).`
      const responseText = await callAI(provider, prompt, apiKey, 'You are an educational assistant. Return only raw valid JSON without markdown wrapping or code blocks.')
      try {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        generatedQuiz = JSON.parse(cleaned)
      } catch (e) {
        console.error('Failed to parse AI quiz JSON:', e)
      }
    }

    if (!generatedQuiz || !Array.isArray(generatedQuiz)) {
      generatedQuiz = makeQuiz(quizSource, count)
    }

    if (noteId && subject) {
      const note = subject.notes.find((item) => item._id?.toString() === noteId)
      if (note) {
        note.quiz = generatedQuiz
        note.hasQuiz = true
        await subject.save()
      }
    }

    return NextResponse.json({ ok: true, quiz: { noteId: noteId ?? null, questions: generatedQuiz } })
  } catch (error) {
    console.error('Quiz route error:', error)
    return NextResponse.json({ ok: false, error: 'invalid request body' }, { status: 400 })
  }
}
