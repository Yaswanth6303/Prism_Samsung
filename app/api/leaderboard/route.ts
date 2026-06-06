import { NextResponse } from 'next/server'
import connectToDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { getLeaderboard, type Metric, type Period } from '@/lib/services/feature-store'

const METRICS: Metric[] = ['points', 'github', 'leetcode', 'streak']
const PERIODS: Period[] = ['alltime', 'weekly', 'monthly']

// GET serves either the in-memory demo leaderboard or the real DB-backed leaderboard.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // The mode flag lets us keep the demo store and real production data path in one endpoint.
  const mode = searchParams.get('mode')

  if (mode === 'store') {
    // These values are read from the query string because the feature store is often used for experiments and demos.
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

  // Production leaderboard comes straight from the database and is sorted by points.
  await connectToDB()
  const users = await User.find().sort({ totalPoints: -1, createdAt: 1 }).limit(20).lean()

  // Map the raw user documents into the compact shape the UI can render immediately.
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
