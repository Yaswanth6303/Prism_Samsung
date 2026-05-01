import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/db'
import DailyActivityLog from '@/models/DailyActivityLog'

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

    const startOfYear = `${year}-01-01`
    const endOfYear = `${year}-12-31`

    const logs = await DailyActivityLog.find({
      userId,
      date: { $gte: startOfYear, $lte: endOfYear },
    }).lean()

    const heatmapData = logs.map((l) => ({
      date: l.date,
      count: l.totalCount,
    }))

    return NextResponse.json({ ok: true, year, data: heatmapData })
  } catch (error) {
    console.error('Heatmap GET Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
