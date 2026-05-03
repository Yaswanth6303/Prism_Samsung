import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'

export const dynamic = 'force-dynamic'

const ProfileBody = z.object({
  name: z.string().min(1).max(80).optional(),
  githubUsername: z.string().max(40).optional().or(z.literal('')),
  leetcodeUsername: z.string().max(40).optional().or(z.literal('')),
})

type ProfileUser = {
  _id: { toString(): string }
  name: string
  email: string
  avatarUrl?: string
  githubUsername?: string
  leetcodeUsername?: string
  totalPoints?: number
  currentStreak?: number
  longestStreak?: number
  rank?: number
  githubContributions?: number
  githubPublicRepos?: number
  githubFollowers?: number
  leetcodeSolved?: number
  leetcodeEasySolved?: number
  leetcodeMediumSolved?: number
  leetcodeHardSolved?: number
  gymSessions?: number
  joggingDistance?: number
  lastPlatformSyncAt?: Date
}

function serializeUser(user: ProfileUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    githubUsername: user.githubUsername || '',
    leetcodeUsername: user.leetcodeUsername || '',
    totalPoints: user.totalPoints ?? 0,
    currentStreak: user.currentStreak ?? 0,
    longestStreak: user.longestStreak ?? 0,
    rank: user.rank ?? 0,
    githubContributions: user.githubContributions ?? 0,
    githubPublicRepos: user.githubPublicRepos ?? 0,
    githubFollowers: user.githubFollowers ?? 0,
    leetcodeSolved: user.leetcodeSolved ?? 0,
    leetcodeEasySolved: user.leetcodeEasySolved ?? 0,
    leetcodeMediumSolved: user.leetcodeMediumSolved ?? 0,
    leetcodeHardSolved: user.leetcodeHardSolved ?? 0,
    gymSessions: user.gymSessions ?? 0,
    joggingDistance: user.joggingDistance ?? 0,
    lastPlatformSyncAt: user.lastPlatformSyncAt?.toISOString?.() ?? null,
  }
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await connectToDB()
  const user = await User.findById(session.user.id).lean()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, profile: serializeUser(user) })
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = ProfileBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.format() }, { status: 400 })
  }

  await connectToDB()
  const update: Record<string, string> = {}
  if (parsed.data.name !== undefined) update.name = parsed.data.name.trim()
  if (parsed.data.githubUsername !== undefined) update.githubUsername = parsed.data.githubUsername.trim()
  if (parsed.data.leetcodeUsername !== undefined) update.leetcodeUsername = parsed.data.leetcodeUsername.trim()

  const user = await User.findByIdAndUpdate(session.user.id, { $set: update }, { new: true }).lean()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, profile: serializeUser(user) })
}
