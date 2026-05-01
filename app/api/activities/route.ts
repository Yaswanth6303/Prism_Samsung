import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Activity } from '@/lib/models/Activity'
import { DailyActivityLog } from '@/lib/models/DailyActivityLog'
import { pointsFor } from '@/lib/points'
import { updateStreakFromLogs } from '@/lib/streak'

type ActivityEvent = {
  _id: { toString(): string }
  type: 'github' | 'leetcode' | 'gym' | 'jogging' | 'study' | 'project'
  title: string
  date?: Date
  createdAt?: Date
  points: number
  details?: string
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    await connectToDB()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || 25), 100)
    const events = await Activity.find({ userId }).sort({ date: -1 }).limit(limit).lean<ActivityEvent[]>()
    
    const activities = events.map((event) => ({
      id: event._id.toString(),
      type: event.type,
      title: event.title,
      date: new Date(event.date ?? event.createdAt ?? new Date()).toISOString().split('T')[0],
      points: event.points,
      details: event.details || '',
    }))

    return NextResponse.json({ ok: true, activities })
  } catch (error) {
    console.error('Activities GET Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

const ActivitySchema = z.object({
  type: z.enum(['github', 'leetcode', 'gym', 'jogging', 'study', 'project']),
  title: z.string().min(1, 'Title is required'),
  value: z.number().positive(),
  details: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json()
    const parsed = ActivitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.format() }, { status: 400 })
    }

    const { type, title, value, details } = parsed.data
    const todayStr = new Date().toISOString().slice(0, 10)
    const dateStr = parsed.data.date || todayStr

    await connectToDB()

    let pts = 0;
    if (type === 'gym') pts = pointsFor('gym_session', value)
    else if (type === 'jogging') pts = pointsFor('jog_per_km', value)
    else if (type === 'github') pts = pointsFor('github_commit', value)
    else if (type === 'leetcode') pts = pointsFor('leetcode_easy', value) // rough approx
    else pts = value

    const activityEvent = new Activity({
      userId,
      type,
      title,
      details,
      date: new Date(dateStr),
      points: pts,
    })
    await activityEvent.save()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    await DailyActivityLog.findOneAndUpdate(
      { userId, date: dateStr },
      { $set: { hasActivity: true }, $inc: { totalCount: 1 } },
      { new: true, upsert: true }
    )

    const dailyLogs = await DailyActivityLog.find({ userId }).lean()
    const { currentStreak, bestStreak } = updateStreakFromLogs({
      userId,
      logs: dailyLogs.map((log) => ({
        userId: log.userId,
        date: log.date,
        hasActivity: log.hasActivity,
        totalCount: log.totalCount,
      })),
      currentStreak: user.currentStreak,
      bestStreak: user.longestStreak,
      today: new Date(`${dateStr}T00:00:00.000Z`),
    })

    user.totalPoints += pts
    user.currentStreak = currentStreak
    user.longestStreak = bestStreak
    
    if (type === 'gym') user.gymSessions += 1
    if (type === 'jogging') user.joggingDistance += value
    if (type === 'leetcode') user.leetcodeSolved += value
    if (type === 'github') user.githubContributions += value

    await user.save()

    return NextResponse.json({ ok: true, activity: activityEvent, pointsAwarded: pts })
  } catch (error) {
    console.error('Activities POST Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
