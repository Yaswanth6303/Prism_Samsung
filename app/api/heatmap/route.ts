import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { DailyActivityLog } from '@/lib/models/DailyActivityLog'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const yearStr = searchParams.get('year') || String(new Date().getFullYear())
    const year = parseInt(yearStr, 10)

    if (isNaN(year)) {
      return NextResponse.json({ ok: false, error: 'Invalid year parameter' }, { status: 400 })
    }

    await connectToDB()

    const logs = await DailyActivityLog.find({
      userId,
      date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    })
      .sort({ date: 1 })
      .lean()

    const heatmapData = logs.map((log) => ({
      date: log.date,
      count: log.totalCount,
    }))

    return NextResponse.json({ ok: true, year, data: heatmapData })
  } catch (error) {
    console.error('Heatmap GET Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}