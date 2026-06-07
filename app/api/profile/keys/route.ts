import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth/server'
import { type IUser, User } from '@/lib/db/models/User'
import connectToDB from '@/lib/db/mongoose'
import { encrypt } from '@/lib/services/encryption'
import { KeysUpdateBodySchema } from '@/types/api'

export const dynamic = 'force-dynamic'

// Only the presence flags leak from this endpoint; raw secrets never cross the wire.
function presenceFlags(user: Pick<IUser, 'openaiKey' | 'anthropicKey' | 'geminiKey' | 'githubPat' | 'leetcodePat'>) {
  return {
    hasOpenAI: !!user.openaiKey,
    hasAnthropic: !!user.anthropicKey,
    hasGemini: !!user.geminiKey,
    hasGithubPat: !!user.githubPat,
    hasLeetKey: !!user.leetcodePat,
  }
}

// GET only returns booleans so the UI can show which secrets are already saved without exposing them.
export async function GET() {
  try {
    // Keys are personal data, so this endpoint is locked to the signed-in user.
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()
    const user = await User.findById(session.user.id)
      .select('openaiKey anthropicKey geminiKey githubPat leetcodePat')
      .lean<Pick<IUser, 'openaiKey' | 'anthropicKey' | 'geminiKey' | 'githubPat' | 'leetcodePat'> | null>()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, ...presenceFlags(user) })
  } catch (error) {
    console.error('Get keys error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST stores encrypted API keys and tokens, or clears them when the user removes a value in the form.
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody: unknown = await request.json()
    const parsed = KeysUpdateBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
    }

    await connectToDB()
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    // Each key is handled separately so users can update one provider without touching the others.
    const { openaiKey, anthropicKey, geminiKey, githubPat, leetcodePat } = parsed.data
    if (openaiKey !== undefined) {
      user.openaiKey = openaiKey ? encrypt(openaiKey.trim()) : undefined
    }
    if (anthropicKey !== undefined) {
      user.anthropicKey = anthropicKey ? encrypt(anthropicKey.trim()) : undefined
    }
    if (geminiKey !== undefined) {
      user.geminiKey = geminiKey ? encrypt(geminiKey.trim()) : undefined
    }
    if (githubPat !== undefined) {
      user.githubPat = githubPat ? encrypt(githubPat.trim()) : undefined
    }
    if (leetcodePat !== undefined) {
      user.leetcodePat = leetcodePat ? encrypt(leetcodePat.trim()) : undefined
    }

    await user.save()

    return NextResponse.json({ ok: true, ...presenceFlags(user) })
  } catch (error) {
    console.error('Save keys error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
