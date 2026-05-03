import { NextResponse } from 'next/server'
import connectToDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { getLeaderboard, type Metric, type Period } from '@/lib/feature-store'

const METRICS: Metric[] = ['points', 'github', 'leetcode', 'streak']
const PERIODS: Period[] = ['alltime', 'weekly', 'monthly']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // mode=store uses in-memory feature-store; default uses DB
  const mode = searchParams.get('mode')

  if (mode === 'store') {
    const metric = (searchParams.get('metric') || 'points') as Metric
    const period = (searchParams.get('period') || 'alltime') as Period
    const userId = searchParams.get('userId') || 'demo-user'
    const collegeId = searchParams.get('collegeId') || 'default-college'

    if (!METRICS.includes(metric)) {
      return NextResponse.json({ ok: false, error: 'metric must be points|github|leetcode|streak' }, { status: 400 })
    }

    if (!PERIODS.includes(period)) {
      return NextResponse.json({ ok: false, error: 'period must be alltime|weekly|monthly' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, leaderboard: getLeaderboard({ metric, period, collegeId, userId }) })
  }

  // DB-backed leaderboard
  await connectToDB()
  const users = await User.find().sort({ totalPoints: -1, createdAt: 1 }).limit(20).lean()

  const leaderboard = users.map((user, index) => ({
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    totalPoints: user.totalPoints ?? 0,
    currentStreak: user.currentStreak ?? 0,
    rank: index + 1,
    isCurrentUser: false,
  }))

  return NextResponse.json({ ok: true, leaderboard })
}
