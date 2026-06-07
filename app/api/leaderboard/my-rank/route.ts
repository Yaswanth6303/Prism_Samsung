import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth/server'
import { User } from '@/lib/db/models/User'
import connectToDB from '@/lib/db/mongoose'

// This endpoint is a lightweight shortcut for showing the signed-in user's own leaderboard position.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDB()
    
    // Pull only the fields needed for rank calculation to keep the query cheap.
    const currentUser = await User.findById(session.user.id)
      .select('name totalPoints currentStreak email')
      .lean()
    
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    // Rank is just the number of users ahead of this one plus one.
    const rankCount = await User.countDocuments({
      totalPoints: { $gt: currentUser.totalPoints || 0 }
    })

    const userEntry = {
      userId: session.user.id,
      name: currentUser.name,
      email: currentUser.email,
      totalPoints: currentUser.totalPoints || 0,
      currentStreak: currentUser.currentStreak || 0,
      rank: rankCount + 1,
      isCurrentUser: true,
    }

    return NextResponse.json({ ok: true, userEntry })
  } catch (error: any) {
    console.error('My Rank Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 500 })
  }
}
