import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { z } from 'zod'

import { auth } from '@/lib/auth/server'
import { type ISubject, Subject } from '@/lib/db/models/Subject'
import connectToDB from '@/lib/db/mongoose'
import { DirectoryCreateBodySchema } from '@/types/api'

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

// Minimal projection of the subject used for serialization — keeps the function type-safe without dragging in the full Mongoose doc.
type SubjectSummary = Pick<ISubject, 'name' | 'color' | 'notesCount' | 'notes'> & {
  _id: { toString(): string }
}

function serializeSubject(subject: SubjectSummary) {
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
  const subjects = await Subject.find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .lean<SubjectSummary[]>()
  const serialized = subjects.map(serializeSubject)
  return NextResponse.json({ ok: true, directories: serialized, subjects: serialized })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = DirectoryCreateBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
    }

    await connectToDB()
    const subject = await Subject.create({
      userId: session.user.id,
      name: parsed.data.name,
      color: parsed.data.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      notes: [],
    })

    const serialized = serializeSubject(subject)
    return NextResponse.json({ ok: true, directory: serialized, subject: serialized })
  } catch (error) {
    console.error('Subject Create Error:', error)
    const message = error instanceof Error ? error.message : 'invalid request body'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

// Schema is inline because the delete endpoint accepts multiple legacy field names for the subject id.
const DeleteBodySchema = z
  .object({
    id: z.string().optional(),
    subjectId: z.string().optional(),
    directoryId: z.string().optional(),
  })
  .refine((data) => Boolean(data.id || data.subjectId || data.directoryId), {
    message: 'subjectId is required',
  })

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = DeleteBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
    }
    const subjectId = parsed.data.id ?? parsed.data.subjectId ?? parsed.data.directoryId

    await connectToDB()
    const result = await Subject.deleteOne({ _id: subjectId, userId: session.user.id })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { ok: false, error: 'subject not found or unauthorized' },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Subject Delete Error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
