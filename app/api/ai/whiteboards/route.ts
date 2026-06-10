import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import mongoose from 'mongoose'

import { auth } from '@/lib/auth/server'
import { type IWhiteboard, Subject } from '@/lib/db/models/Subject'
import connectToDB from '@/lib/db/mongoose'
import { WhiteboardCreateBodySchema } from '@/types/api'

// Sorted whiteboard list (newest first) — extracted because GET, POST, and DELETE all return it.
function sortByCreatedDateDesc(boards: IWhiteboard[]) {
  return [...boards].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
  )
}

function parseObjectId(id: string) {
  try {
    return new mongoose.Types.ObjectId(id.trim())
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId') || searchParams.get('directoryId')
    if (!subjectId) {
      return NextResponse.json({ ok: false, error: 'subjectId is required' }, { status: 400 })
    }

    const oid = parseObjectId(subjectId)
    if (!oid) {
      return NextResponse.json({ ok: false, error: 'invalid id format' }, { status: 400 })
    }

    await connectToDB()
    const subject = await Subject.findOne({ _id: oid, userId: session.user.id })
      .select('whiteboards')
      .lean<{ whiteboards?: IWhiteboard[] } | null>()

    if (!subject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      whiteboards: sortByCreatedDateDesc(subject.whiteboards ?? []),
    })
  } catch (error) {
    console.error('Whiteboard Load Error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = WhiteboardCreateBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.message },
        { status: 400 },
      )
    }

    const oid = parseObjectId(parsed.data.subjectId)
    if (!oid) {
      return NextResponse.json({ ok: false, error: 'invalid id format' }, { status: 400 })
    }

    await connectToDB()
    const subject = await Subject.findOne({ _id: oid, userId: session.user.id })
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }

    const newWhiteboard: IWhiteboard = {
      _id: new mongoose.Types.ObjectId(),
      title: parsed.data.title || 'Whiteboard',
      image: parsed.data.image,
      createdDate: new Date(),
    }
    subject.whiteboards.push(newWhiteboard)
    await subject.save()

    return NextResponse.json({
      ok: true,
      whiteboard: newWhiteboard,
      whiteboards: sortByCreatedDateDesc(subject.whiteboards),
    })
  } catch (error) {
    console.error('Whiteboard Save Error:', error)
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
    const { searchParams } = new URL(request.url)
    const subjectId = (searchParams.get('subjectId') || '').trim()
    const whiteboardId = (searchParams.get('whiteboardId') || '').trim()
    const createdDate = searchParams.get('createdDate')

    if (!subjectId) {
      return NextResponse.json({ ok: false, error: 'subjectId is required' }, { status: 400 })
    }

    const oid = parseObjectId(subjectId)
    if (!oid) {
      return NextResponse.json({ ok: false, error: 'invalid id format' }, { status: 400 })
    }

    await connectToDB()
    const subject = await Subject.findOne({ _id: oid })
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }
    if (subject.userId.toString() !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'unauthorized access' }, { status: 403 })
    }

    const initialCount = subject.whiteboards.length
    // Match by ID first; if not present, fall back to exact-or-parsed createdDate compare.
    subject.whiteboards = subject.whiteboards.filter((board) => {
      const boardId = board._id?.toString() ?? ''
      if (whiteboardId && boardId === whiteboardId) {
        return false
      }
      if (createdDate && board.createdDate) {
        const boardDateIso = new Date(board.createdDate).toISOString()
        const targetIso = new Date(createdDate).toISOString()
        if (boardDateIso === targetIso) {
          return false
        }
      }
      return true
    })
    await subject.save()

    return NextResponse.json({
      ok: true,
      whiteboards: sortByCreatedDateDesc(subject.whiteboards),
      debug: {
        removed: initialCount - subject.whiteboards.length,
      },
    })
  } catch (error) {
    console.error('Whiteboard Delete Error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
