import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import connectToDB from '@/lib/db/mongoose'
import Connection from '@/lib/db/models/Connection'

// GET returns the user's saved connections so the UI can list linked accounts in one place.
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  await connectToDB()
  const conns = await Connection.find({ userId }).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ ok: true, connections: conns })
}

// This schema keeps connection creation flexible without letting arbitrary fields slip through.
const PostBody = z.object({ provider: z.string(), providerId: z.string().optional(), accountName: z.string().optional(), accessToken: z.string().optional() })

// POST stores a new connection record for the signed-in user.
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  // Validate first so malformed connection payloads never reach the database.
  const body = await req.json()
  const parsed = PostBody.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })

  await connectToDB()
  // Attach the current user id server-side so clients cannot impersonate another account.
  const data = { ...parsed.data, userId: session.user.id }
  const conn = await Connection.create(data)
  return NextResponse.json({ ok: true, connection: conn })
}
