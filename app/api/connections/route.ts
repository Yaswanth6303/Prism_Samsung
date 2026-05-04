import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import Connection from '@/lib/models/Connection'

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  await connectToDB()
  const conns = await Connection.find({ userId }).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ ok: true, connections: conns })
}

const PostBody = z.object({ provider: z.string(), providerId: z.string().optional(), accountName: z.string().optional(), accessToken: z.string().optional() })

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = PostBody.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })

  await connectToDB()
  const data = { ...parsed.data, userId: session.user.id }
  const conn = await Connection.create(data)
  return NextResponse.json({ ok: true, connection: conn })
}
