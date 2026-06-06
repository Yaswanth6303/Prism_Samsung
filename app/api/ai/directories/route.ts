import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import connectToDB from '@/lib/db/mongoose'
import { Subject } from '@/lib/db/models/Subject'

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

function serializeSubject(subject: {
  _id: { toString(): string }
  name: string
  color: string
  notesCount?: number
  notes?: unknown[]
}) {
  return {
    id: subject._id.toString(),
    name: subject.name,
    color: subject.color,
    notesCount: subject.notesCount ?? subject.notes?.length ?? 0,
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await connectToDB()
  const subjects = await Subject.find({ userId: session.user.id }).sort({ updatedAt: -1 }).lean()
  return NextResponse.json({ ok: true, directories: subjects.map(serializeSubject), subjects: subjects.map(serializeSubject) })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    if (!body.name) {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 })
    }

    await connectToDB()
    const subject = await Subject.create({
      userId: session.user.id,
      name: body.name,
      color: body.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      notes: [],
    })

    return NextResponse.json({ ok: true, directory: serializeSubject(subject), subject: serializeSubject(subject) })
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid request body' }, { status: 400 })
  }
}
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const subjectId = body.id || body.subjectId || body.directoryId

    if (!subjectId) {
      return NextResponse.json({ ok: false, error: 'subjectId is required' }, { status: 400 })
    }

    await connectToDB()
    const result = await Subject.deleteOne({ _id: subjectId, userId: session.user.id })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: 'subject not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Subject Delete Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 500 })
  }
}
