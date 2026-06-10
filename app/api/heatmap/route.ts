import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth/server'
import { Activity } from '@/lib/db/models/Activity'
import { DailyActivityLog } from '@/lib/db/models/DailyActivityLog'
import connectToDB from '@/lib/db/mongoose'

// This endpoint packages yearly activity into a heatmap-friendly structure for the calendar view.
export async function GET(request: Request) {
  try {
    // Heatmap data is private, so we always verify the caller first.
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // The year filter lets the UI request a precise window without downloading every record.
    const { searchParams } = new URL(request.url)
    const yearStr = searchParams.get('year') || String(new Date().getFullYear())
    const year = parseInt(yearStr, 10)

    if (isNaN(year)) {
      return NextResponse.json({ ok: false, error: 'Invalid year parameter' }, { status: 400 })
    }

    await connectToDB()

    // Daily logs are the source of truth for whether a day should appear active on the grid.
    const logs = await DailyActivityLog.find({
      userId,
      date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    })
      .sort({ date: 1 })
      .lean()

    // Activity titles are collected separately so the hover tooltip can show what happened on each active day.
    const activities = await Activity.find({
      userId,
      date: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`),
      },
    })
      .sort({ date: 1 })
      .select('title date')
      .lean()

    // Group activity titles by day so the front end can render a compact tooltip per cell.
    const activitiesByDate: Record<string, string[]> = {}
    for (const activity of activities) {
      const date = new Date(activity.date).toISOString().slice(0, 10)
      const bucket = activitiesByDate[date] ?? (activitiesByDate[date] = [])
      bucket.push(activity.title)
    }

    // Merge counts and titles into one calendar-friendly payload.
    const heatmapData = logs.map((log) => ({
      date: log.date,
      count: log.totalCount,
      activities: activitiesByDate[log.date] ?? [],
    }))

    return NextResponse.json({ ok: true, year, data: heatmapData })
  } catch (error) {
    // Return a safe server error if either collection query fails.
    console.error('Heatmap GET Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}