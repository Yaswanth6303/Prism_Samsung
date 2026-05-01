import { NextResponse } from 'next/server'
import { getLeaderboard, type Metric, type Period } from '@/lib/feature-store'

const METRICS: Metric[] = ['points', 'github', 'leetcode', 'streak']
const PERIODS: Period[] = ['alltime', 'weekly', 'monthly']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

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
