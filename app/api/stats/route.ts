import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import connectToDB from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/User'
import { Activity } from '@/lib/db/models/Activity'
import { DailyActivityLog } from '@/lib/db/models/DailyActivityLog'

// This endpoint aggregates the numbers the dashboard needs without making the client query multiple collections.
export async function GET(request: Request) {
  try {
    // Stats are per-user, so we always start by confirming the caller owns the account.
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    await connectToDB()

    // We need the saved user record to compute rank and surface the latest summary fields.
    const user = await User.findById(userId).lean()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    // Activity counts and log counts are calculated separately because they answer different dashboard questions.
    const activityCount = await Activity.countDocuments({ userId })
    const dailyLogs = await DailyActivityLog.find({ userId }).lean()
    const higherRankedUsers = await User.countDocuments({ totalPoints: { $gt: user.totalPoints ?? 0 } })

    return NextResponse.json({
      ok: true,
      stats: {
        userId,
        totalPoints: user.totalPoints,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        rank: higherRankedUsers + 1,
        githubUsername: user.githubUsername,
        leetcodeUsername: user.leetcodeUsername,
        githubContributions: user.githubContributions,
        githubPublicRepos: user.githubPublicRepos ?? 0,
        githubFollowers: user.githubFollowers ?? 0,
        leetcodeSolved: user.leetcodeSolved,
        leetcodeEasySolved: user.leetcodeEasySolved ?? 0,
        leetcodeMediumSolved: user.leetcodeMediumSolved ?? 0,
        leetcodeHardSolved: user.leetcodeHardSolved ?? 0,
        gymSessions: user.gymSessions,
        joggingDistance: user.joggingDistance,
        activityCount,
        dailyLogCount: dailyLogs.length,
      },
    })
  } catch (error) {
    // If the aggregation fails, return a safe generic error rather than leaking internals.
    console.error('Stats GET Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
