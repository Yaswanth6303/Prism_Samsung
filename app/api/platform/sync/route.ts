import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { Activity } from '@/lib/models/Activity'
import { DailyActivityLog } from '@/lib/models/DailyActivityLog'
import { User } from '@/lib/models/User'
import { fetchGitHubSnapshot, fetchLeetCodeSnapshot, type PlatformSnapshot } from '@/lib/platform-sync'
import { pointsFor } from '@/lib/points'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await connectToDB()
  const user = await User.findById(session.user.id)
  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
  }

  const snapshot: PlatformSnapshot = {}
  const errors: string[] = []
  const results: Array<{ provider: 'github' | 'leetcode'; ok: boolean; message: string }> = []

  if (user.githubUsername) {
    try {
      snapshot.github = await fetchGitHubSnapshot(user.githubUsername)
      results.push({
        provider: 'github',
        ok: true,
        message: `Fetched ${snapshot.github.publicRepos} repos, ${snapshot.github.followers} followers, ${snapshot.github.recentContributions} recent public contributions`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GitHub sync failed'
      errors.push(message)
      results.push({ provider: 'github', ok: false, message })
    }
  }

  if (user.leetcodeUsername) {
    try {
      snapshot.leetcode = await fetchLeetCodeSnapshot(user.leetcodeUsername)
      results.push({
        provider: 'leetcode',
        ok: true,
        message: `Fetched ${snapshot.leetcode.totalSolved} solved problems`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'LeetCode sync failed'
      errors.push(message)
      results.push({ provider: 'leetcode', ok: false, message })
    }
  }

  if (!user.githubUsername && !user.leetcodeUsername) {
    return NextResponse.json({
      ok: false,
      error: 'Add a GitHub or LeetCode username in Profile before syncing.',
      snapshot,
      pointsAwarded: 0,
      results,
      errors: ['No platform usernames set'],
    }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  let pointsDelta = 0
  let activityCount = 0

  if (snapshot.github) {
    const oldCount = user.githubContributions ?? 0
    const newCount = snapshot.github.recentContributions
    const delta = Math.max(0, newCount - oldCount)
    if (delta > 0) {
      const points = pointsFor('github_commit', delta)
      pointsDelta += points
      activityCount += delta
      await Activity.create({
        userId: user._id,
        type: 'github',
        title: `Synced ${delta} GitHub contribution${delta === 1 ? '' : 's'}`,
        details: snapshot.github.username,
        date: new Date(),
        points,
      })
    }

    user.githubUsername = snapshot.github.username
    user.avatarUrl = snapshot.github.avatarUrl || user.avatarUrl
    user.githubContributions = newCount
    user.githubPublicRepos = snapshot.github.publicRepos
    user.githubFollowers = snapshot.github.followers
  }

  if (snapshot.leetcode) {
    const oldCount = user.leetcodeSolved ?? 0
    const newCount = snapshot.leetcode.totalSolved
    const delta = Math.max(0, newCount - oldCount)
    if (delta > 0) {
      const points = pointsFor('leetcode_easy', delta)
      pointsDelta += points
      activityCount += delta
      await Activity.create({
        userId: user._id,
        type: 'leetcode',
        title: `Synced ${delta} solved LeetCode problem${delta === 1 ? '' : 's'}`,
        details: snapshot.leetcode.username,
        date: new Date(),
        points,
      })
    }

    user.leetcodeUsername = snapshot.leetcode.username
    if (!user.avatarUrl && snapshot.leetcode.avatarUrl) user.avatarUrl = snapshot.leetcode.avatarUrl
    user.leetcodeSolved = newCount
    user.leetcodeEasySolved = snapshot.leetcode.easySolved
    user.leetcodeMediumSolved = snapshot.leetcode.mediumSolved
    user.leetcodeHardSolved = snapshot.leetcode.hardSolved
  }

  if (activityCount > 0) {
    await DailyActivityLog.findOneAndUpdate(
      { userId: user._id.toString(), date: today },
      { $set: { hasActivity: true }, $inc: { totalCount: activityCount } },
      { new: true, upsert: true }
    )
  }

  user.totalPoints += pointsDelta
  user.lastPlatformSyncAt = new Date()
  await user.save()

  return NextResponse.json({
    ok: errors.length === 0 || Boolean(snapshot.github || snapshot.leetcode),
    snapshot,
    pointsAwarded: pointsDelta,
    results,
    errors,
  })
}
