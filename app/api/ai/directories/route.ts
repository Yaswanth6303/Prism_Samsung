import { NextResponse } from 'next/server'
import { createDirectory, listDirectories } from '@/lib/feature-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || 'demo-user'
  return NextResponse.json({ ok: true, directories: listDirectories(userId) })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = body.userId || 'demo-user'
    if (!body.name) {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 })
    }
    const directory = createDirectory({ userId, name: body.name, color: body.color })
    return NextResponse.json({ ok: true, directory })
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid request body' }, { status: 400 })
  }
}
