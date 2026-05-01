import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/db'
import User from '@/models/User'
import ActivityEvent from '@/models/ActivityEvent'

export async function GET(request: Request) {
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

    const activityCount = await ActivityEvent.countDocuments({ userId })

    return NextResponse.json({
      ok: true,
      stats: {
        userId,
        totalPoints: user.totalPoints,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        activityCount,
      },
    })
  } catch (error) {
    console.error('Stats GET Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
