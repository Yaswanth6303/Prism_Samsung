import { NextResponse } from 'next/server'
import { getFeed } from '@/lib/feature-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || 'demo-user'
  const limit = Number(searchParams.get('limit') || 25)
  return NextResponse.json({ ok: true, feed: getFeed(userId, limit) })
}
