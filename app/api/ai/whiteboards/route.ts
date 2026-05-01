import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { Subject } from '@/lib/models/Subject'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId') || searchParams.get('directoryId')
    if (!subjectId) {
      return NextResponse.json({ ok: false, error: 'subjectId is required' }, { status: 400 })
    }

    await connectToDB()
    const { ObjectId } = require('mongodb')
    let oid;
    try {
      oid = new ObjectId(subjectId.trim());
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'invalid id format' }, { status: 400 })
    }

    const subject = await (Subject as any).collection.findOne({ _id: oid })
    
    if (!subject || subject.userId.toString() !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }

    const whiteboards = (subject.whiteboards ?? []).sort((a: any, b: any) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    )

    return NextResponse.json({ ok: true, whiteboards })
  } catch (error: any) {
    console.error('Whiteboard Load Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const subjectId = body.subjectId || body.directoryId
    const image = body.image
    const title = body.title

    if (!subjectId || !image) {
      return NextResponse.json({ ok: false, error: 'subjectId and image are required' }, { status: 400 })
    }

    await connectToDB()
    const { ObjectId } = require('mongodb')
    let oid;
    try {
      oid = new ObjectId(subjectId.trim());
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'invalid id format' }, { status: 400 })
    }

    const whiteboard = {
      title: title || 'Whiteboard',
      image,
      createdDate: new Date(),
    }
    
    const whiteboardWithId = {
      ...whiteboard,
      _id: new ObjectId(),
    }

    const result = await (Subject as any).collection.findOneAndUpdate(
      { _id: oid, userId: new ObjectId(session.user.id) },
      { $push: { whiteboards: whiteboardWithId } },
      { returnDocument: 'after' }
    )

    const updatedSubject = result.value || result

    if (!updatedSubject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }

    const whiteboards = updatedSubject.whiteboards ?? []
    const sortedWhiteboards = [...whiteboards].sort((a: any, b: any) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    )

    return NextResponse.json({ 
      ok: true, 
      whiteboard: whiteboardWithId, 
      whiteboards: sortedWhiteboards 
    })
  } catch (error: any) {
    console.error('Whiteboard Save Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
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

    await connectToDB()
    const { ObjectId } = require('mongodb')
    
    let oid;
    try {
      oid = new ObjectId(subjectId);
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'invalid id format' }, { status: 400 })
    }

    const subject = await (Subject as any).collection.findOne({ _id: oid })
    if (!subject) {
      return NextResponse.json({ ok: false, error: 'subject not found' }, { status: 404 })
    }
    
    if (subject.userId.toString() !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'unauthorized access' }, { status: 403 })
    }

    const initialWhiteboards = subject.whiteboards ?? []
    
    // Nuclear Deletion: Try matching by multiple fields
    const filteredWhiteboards = initialWhiteboards.filter((w: any) => {
      // 1. Try ID
      const wId = (w._id?.toString() || w.id?.toString() || '').trim()
      if (whiteboardId && wId === whiteboardId) return false
      
      // 2. Try exact createdDate string
      if (createdDate && w.createdDate) {
         if (w.createdDate.toString() === createdDate) return false
         if (new Date(w.createdDate).toISOString() === new Date(createdDate).toISOString()) return false
      }
      
      return true
    })

    console.log('DELETE Debug:', { 
        subjectId, 
        whiteboardId, 
        initialCount: initialWhiteboards.length, 
        finalCount: filteredWhiteboards.length 
    })

    const updateResult = await (Subject as any).collection.updateOne(
      { _id: oid },
      { $set: { whiteboards: filteredWhiteboards } }
    )

    const sortedWhiteboards = [...filteredWhiteboards].sort((a: any, b: any) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    )

    return NextResponse.json({ 
      ok: true, 
      whiteboards: sortedWhiteboards,
      debug: { 
        matched: updateResult.matchedCount, 
        modified: updateResult.modifiedCount,
        removed: initialWhiteboards.length - filteredWhiteboards.length
      }
    })
  } catch (error: any) {
    console.error('Whiteboard Delete Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 500 })
  }
}
