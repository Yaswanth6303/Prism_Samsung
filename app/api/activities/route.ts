import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/db'
import User from '@/models/User'
import ManualActivity from '@/models/ManualActivity'
import ActivityEvent from '@/models/ActivityEvent'
import DailyActivityLog from '@/models/DailyActivityLog'
import { pointsFor } from '@/lib/points'
import { updateStreakFromLogs } from '@/lib/streak'

const ActivitySchema = z.object({
  type: z.enum(['gym', 'jog', 'custom']),
  label: z.string().min(1, 'Label is required'),
  value: z.number().positive(),
  unit: z.string().optional(),
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

    const { type, label, value, unit } = parsed.data
    const todayStr = new Date().toISOString().slice(0, 10)
    const date = parsed.data.date || todayStr

    await connectToDB()

    const eventType = type === 'gym' ? 'gym_session' : type === 'jog' ? 'jog_per_km' : 'custom'
    const pts = pointsFor(eventType, value)

    const manualActivity = new ManualActivity({ userId, type, label, value, unit, date, pointsAwarded: pts })
    await manualActivity.save()

    const activityEvent = new ActivityEvent({
      userId,
      platform: 'manual',
      type,
      title: `Manual activity: ${label}`,
      subtitle: `${value}${unit ? ` ${unit}` : ''}`,
      metadata: { manualActivityId: manualActivity._id },
      pointsAwarded: pts,
    })
    await activityEvent.save()

    await DailyActivityLog.findOneAndUpdate(
      { userId, date },
      { $set: { hasActivity: true }, $inc: { totalCount: 1 } },
      { new: true, upsert: true }
    )

    const user = await User.findById(userId).lean()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const allLogs = await DailyActivityLog.find({ userId }).lean()
    
    const formattedLogs = allLogs.map(l => ({
      userId: l.userId, 
      date: l.date, 
      hasActivity: l.hasActivity, 
      totalCount: l.totalCount
    }))

    const { currentStreak, bestStreak } = updateStreakFromLogs({
      userId,
      logs: formattedLogs,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      today: new Date(date + 'T00:00:00.000Z') 
    })

    await User.findByIdAndUpdate(userId, {
      $inc: { totalPoints: pts },
      $set: { currentStreak, bestStreak }
    })

    return NextResponse.json({ ok: true, activity: manualActivity, event: activityEvent, pointsAwarded: pts })
  } catch (error) {
    console.error('Activities POST Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
