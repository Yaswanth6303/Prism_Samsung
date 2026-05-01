import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Activity } from '@/lib/models/Activity'
import { DailyActivityLog } from '@/lib/models/DailyActivityLog'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    await connectToDB()

    const user = await User.findById(userId).lean()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

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
    console.error('Stats GET Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
