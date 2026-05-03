import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'

// Fast endpoint to get just the current user's rank
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDB()
    
    // Get current user's points
    const currentUser = await User.findById(session.user.id)
      .select('name totalPoints currentStreak email')
      .lean()
    
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    // Count how many users have more points (for rank calculation)
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
