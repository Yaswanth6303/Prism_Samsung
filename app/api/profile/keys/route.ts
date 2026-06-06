import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import connectToDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { encrypt } from '@/lib/services/encryption'

export const dynamic = 'force-dynamic'

// GET only returns booleans so the UI can show which secrets are already saved without exposing them.
export async function GET(request: Request) {
  try {
    // Keys are personal data, so this endpoint is locked to the signed-in user.
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()
    const user = await User.findById(session.user.id).select('openaiKey anthropicKey geminiKey githubPat leetcodePat').lean()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      hasOpenAI: !!user.openaiKey,
      hasAnthropic: !!user.anthropicKey,
      hasGemini: !!user.geminiKey,
      hasGithubPat: !!user.githubPat,
      hasLeetKey: !!user.leetcodePat,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST stores encrypted API keys and tokens, or clears them when the user removes a value in the form.
export async function POST(request: Request) {
  try {
    // Re-check the session here because this endpoint writes sensitive data.
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    await connectToDB()
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    // Each key is handled separately so users can update one provider without touching the others.
    if (body.openaiKey !== undefined) {
      user.openaiKey = body.openaiKey ? encrypt(body.openaiKey.trim()) : undefined
    }
    
    if (body.anthropicKey !== undefined) {
      user.anthropicKey = body.anthropicKey ? encrypt(body.anthropicKey.trim()) : undefined
    }
    
    if (body.geminiKey !== undefined) {
      user.geminiKey = body.geminiKey ? encrypt(body.geminiKey.trim()) : undefined
    }

    if (body.githubPat !== undefined) {
      user.githubPat = body.githubPat ? encrypt(body.githubPat.trim()) : undefined
    }

    if (body.leetcodePat !== undefined) {
      user.leetcodePat = body.leetcodePat ? encrypt(body.leetcodePat.trim()) : undefined
    }

    await user.save()

    // Return only presence flags so the client can refresh the secure key status chips.
    return NextResponse.json({
      ok: true,
      hasOpenAI: !!user.openaiKey,
      hasAnthropic: !!user.anthropicKey,
      hasGemini: !!user.geminiKey,
      hasGithubPat: !!user.githubPat,
      hasLeetKey: !!user.leetcodePat,
    })
  } catch (error) {
    console.error('Save keys error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
