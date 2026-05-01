import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { encrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()
    const user = await User.findById(session.user.id).select('openaiKey anthropicKey geminiKey githubPat').lean()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      hasOpenAI: !!user.openaiKey,
      hasAnthropic: !!user.anthropicKey,
      hasGemini: !!user.geminiKey,
      hasGithubPat: !!user.githubPat,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    await connectToDB()
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

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

    await user.save()

    return NextResponse.json({
      ok: true,
      hasOpenAI: !!user.openaiKey,
      hasAnthropic: !!user.anthropicKey,
      hasGemini: !!user.geminiKey,
      hasGithubPat: !!user.githubPat,
    })
  } catch (error) {
    console.error('Save keys error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
