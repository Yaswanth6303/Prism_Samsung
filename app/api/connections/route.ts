import { NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDB from '@/lib/mongodb'
import Connection from '@/lib/models/Connection'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 })

  await connectToDB()
  const conns = await Connection.find({ userId }).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ ok: true, connections: conns })
}

const PostBody = z.object({ userId: z.string(), provider: z.string(), providerId: z.string().optional(), accountName: z.string().optional(), accessToken: z.string().optional() })

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = PostBody.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })

  await connectToDB()
  const conn = await Connection.create(parsed.data)
  return NextResponse.json({ ok: true, connection: conn })
}
