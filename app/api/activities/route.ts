import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { z } from 'zod'

import { auth } from '@/lib/auth/server'
import { Activity } from '@/lib/db/models/Activity'
import { DailyActivityLog } from '@/lib/db/models/DailyActivityLog'
import { User } from '@/lib/db/models/User'
import connectToDB from '@/lib/db/mongoose'
import { pointsFor } from '@/lib/services/points'
import { updateStreakFromLogs } from '@/lib/services/streak'

// Normalized activity shape returned to the UI so cards and feeds can render one list consistently.
type ActivityEvent = {
  _id: { toString(): string }
  type: 'github' | 'leetcode' | 'gym' | 'jogging' | 'study' | 'project'
  title: string
  date?: Date
  createdAt?: Date
  points: number
  details?: string
}

// GET returns the user's activity feed, optionally narrowed to a single day.
export async function GET(request: Request) {
  try {
    // The feed is private, so the request must belong to a logged-in user.
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    await connectToDB()

    const { searchParams } = new URL(request.url)
    // A small default keeps the feed fast, while the date filter can request a bigger window for a single day.
    const limit = Math.min(Number(searchParams.get('limit') || 25), 100)
    const dateQuery = searchParams.get('date')

    let query: any = { userId }
    if (dateQuery) {
      // Build a UTC day range so a local browser timezone does not shift the result.
      const startDate = new Date(dateQuery)
      startDate.setUTCHours(0, 0, 0, 0)
      const endDate = new Date(dateQuery)
      endDate.setUTCHours(23, 59, 59, 999)
      query = {
        userId,
        $or: [
          { date: { $gte: startDate, $lte: endDate } },
          { createdAt: { $gte: startDate, $lte: endDate }, date: null }
        ]
      }
    }

    const events = await Activity.find(query).sort({ date: -1 }).limit(dateQuery ? 1000 : limit).lean<ActivityEvent[]>()
    
    // Shape the database records into the flatter object the client already expects.
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

// The feed form validates inputs before a custom activity is written to the database.
const ActivitySchema = z.object({
  type: z.enum(['github', 'leetcode', 'gym', 'jogging', 'study', 'project']),
  title: z.string().min(1, 'Title is required'),
  value: z.number().positive(),
  details: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
})

// POST lets the user add a manual activity, then updates points and streaks to match.
export async function POST(request: Request) {
  try {
    // Manual activities are also private, so we guard them with the session check.
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    console.log("Activities POST by user:", userId)
    const body = await request.json()
    const parsed = ActivitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.format() }, { status: 400 })
    }

    // Normalize the incoming payload before it becomes a durable record.
    const { type, title, value, details } = parsed.data
    const todayStr = new Date().toISOString().slice(0, 10)
    const dateStr = parsed.data.date || todayStr
    console.log("Parsed activity data:", { type, title, value, details, dateStr })

    await connectToDB()
  
  // Convert the submitted activity type into the scoring model the rest of the app uses.
    let pts = 0;
    if (type === 'gym') {pts = pointsFor('gym_session', value)}
    else if (type === 'jogging') {pts = pointsFor('jog_per_km', value)}
    else if (type === 'github') {pts = pointsFor('github_commit', value)}
    else if (type === 'leetcode') {pts = pointsFor('leetcode_easy', value)} // rough approx
    else {pts = value}

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
      .select('totalPoints currentStreak longestStreak gymSessions joggingDistance leetcodeSolved githubContributions')
      .lean<{
        totalPoints?: number
        currentStreak?: number
        longestStreak?: number
        gymSessions?: number
        joggingDistance?: number
        leetcodeSolved?: number
        githubContributions?: number
      } | null>()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }
    console.log("User before update:", {
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,});

    // Every manual activity marks that day as active so the streak engine can do its job.
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
    // Build the atomic increments separately so each activity type updates only the counters it owns.
        date: log.date,
        hasActivity: log.hasActivity,
        totalCount: log.totalCount,
      })),
      currentStreak: user.currentStreak ?? 0,
      bestStreak: user.longestStreak ?? 0,
      today: new Date(`${dateStr}T00:00:00.000Z`),
    })
    console.log("Daily logs:", dailyLogs)
    console.log("Updated user streaks:", { currentStreak, bestStreak })

    const $inc: Record<string, number> = {
      totalPoints: pts,
    }
    if (type === 'gym') {$inc.gymSessions = 1}
    if (type === 'jogging') {$inc.joggingDistance = value}
    if (type === 'leetcode') {$inc.leetcodeSolved = value}
    if (type === 'github') {$inc.githubContributions = value}

    await User.updateOne(
      { _id: userId },
      {
        $inc,
        $set: {
          currentStreak,
          longestStreak: bestStreak,
        },
      }
    )

    return NextResponse.json({ ok: true, activity: activityEvent, pointsAwarded: pts })
  } catch (error) {
    // Keep the response generic and only log the detailed failure for server-side debugging.
    console.error('Activities POST Error:', error)
    if (error instanceof Error) {
      console.error('Activities POST Error Stack:', error.stack)
    }
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
