import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import connectToDB from '@/lib/mongodb'
import { Activity } from '@/lib/models/Activity'
import { DailyActivityLog } from '@/lib/models/DailyActivityLog'
import { User } from '@/lib/models/User'
import { fetchGitHubSnapshot, fetchLeetCodeSnapshot, type PlatformSnapshot } from '@/lib/platform-sync'
import { pointsFor } from '@/lib/points'
import { recalculateAllStreaks } from '@/lib/streak'
import { decrypt } from '@/lib/encryption'
import { db } from '@/db'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
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

  // If user doesn't have GitHub username saved but has GitHub linked, try to extract it from OAuth
  let githubUsername = user.githubUsername
  if (!githubUsername) {
    try {
      // Query better-auth's accounts collection for GitHub account
      const accountsCollection = db.collection('account')
      const githubAccount = await accountsCollection.findOne({ userId: user._id.toString(), provider: 'github' })
      if (githubAccount?.accountId) {
        // accountId for GitHub contains the username
        githubUsername = githubAccount.accountId
        // Save it to user for future syncs
        user.githubUsername = githubUsername
      }
    } catch (e) {
      // continue without GitHub username
    }
  }

  if (githubUsername) {
    try {
      const pat = user.githubPat ? decrypt(user.githubPat) : undefined
      snapshot.github = await fetchGitHubSnapshot(githubUsername, pat)
      console.log(`[Sync] GitHub: ${githubUsername}`, {
        repos: snapshot.github.publicRepos,
        followers: snapshot.github.followers,
        historyDays: Object.keys(snapshot.github.history).length,
      })
      results.push({
        provider: 'github',
        ok: true,
        message: `Fetched ${snapshot.github.publicRepos} repos, ${snapshot.github.followers} followers, ${snapshot.github.recentContributions} recent public contributions`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GitHub sync failed'
      console.error(`[Sync] GitHub error:`, message)
      errors.push(message)
      results.push({ provider: 'github', ok: false, message })
    }
  }

  if (user.leetcodeUsername) {
    try {
      const leetToken = user.leetcodePat ? decrypt(user.leetcodePat) : undefined
      snapshot.leetcode = await fetchLeetCodeSnapshot(user.leetcodeUsername, leetToken)
      console.log(`[Sync] LeetCode: ${user.leetcodeUsername}`, {
        totalSolved: snapshot.leetcode.totalSolved,
        historyDays: Object.keys(snapshot.leetcode.history).length,
      })
      results.push({
        provider: 'leetcode',
        ok: true,
        message: `Fetched ${snapshot.leetcode.totalSolved} solved problems`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'LeetCode sync failed'
      console.error(`[Sync] LeetCode error:`, message)
      errors.push(message)
      results.push({ provider: 'leetcode', ok: false, message })
    }
  }

  if (!githubUsername && !user.leetcodeUsername) {
    return NextResponse.json({
      ok: false,
      error: 'Add a GitHub or LeetCode username in Profile before syncing.',
      snapshot,
      pointsAwarded: 0,
      results,
      errors: ['No platform usernames set'],
    }, { status: 400 })
  }

  let pointsDelta = 0
  let historyUpdated = false

  // Helper to process history — user is guaranteed non-null at this point
  const userId = user._id
  async function processHistory(
    history: Record<string, number>,
    type: 'github' | 'leetcode',
    pointType: 'github_commit' | 'leetcode_easy',
    titleFn: (count: number) => string,
    details: string
  ) {
    console.log(`[processHistory] Starting for ${type}, total days: ${Object.keys(history).length}`)
    for (const [dateStr, count] of Object.entries(history)) {
      if (count <= 0) continue

      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
      const expectedPoints = pointsFor(pointType, count)

      // Try atomic upsert: create the activity if missing. updateOne with upsert
      const filter = {
        userId: userId,
        type,
        date: { $gte: startOfDay, $lte: endOfDay }
      }

      const upsertResult = await Activity.updateOne(
        filter,
        {
          $setOnInsert: {
            userId: userId,
            type,
            title: titleFn(count),
            details,
            date: startOfDay,
            points: expectedPoints,
          },
        },
        { upsert: true }
      )

      // If we inserted a new activity, upsertResult.upsertedCount will be > 0
      // (Mongoose returns a WriteResult-like object)
      // Award points and mark daily log atomically.
      // @ts-ignore - depending on driver, upsertedCount may be available
      if (upsertResult && (upsertResult as any).upsertedCount > 0) {
        await DailyActivityLog.findOneAndUpdate(
          { userId: userId.toString(), date: dateStr },
          { $set: { hasActivity: true }, $inc: { totalCount: count } },
          { new: true, upsert: true }
        )
        pointsDelta += expectedPoints
        historyUpdated = true
      } else {
        // Existing activity: load and update if they did more than before
        const existing = await Activity.findOne(filter)
        if (existing) {
          const previousPoints = existing.points
          if (expectedPoints > previousPoints) {
            const addedPoints = expectedPoints - previousPoints
            const addedCount = count - Math.floor(previousPoints / pointsFor(pointType, 1))

            await Activity.updateOne({ _id: existing._id }, { $set: { points: expectedPoints, title: titleFn(count) } })

            await DailyActivityLog.updateOne(
              { userId: userId.toString(), date: dateStr },
              { $inc: { totalCount: addedCount } }
            )
            pointsDelta += addedPoints
            historyUpdated = true
          }
        }
      }
    }
  }

  if (snapshot.github) {
    user.githubUsername = snapshot.github.username
    user.avatarUrl = snapshot.github.avatarUrl || user.avatarUrl
    user.githubContributions = snapshot.github.recentContributions
    user.githubPublicRepos = snapshot.github.publicRepos
    user.githubFollowers = snapshot.github.followers

    await processHistory(
      snapshot.github.history,
      'github',
      'github_commit',
      (c) => `Synced ${c} GitHub contribution${c === 1 ? '' : 's'}`,
      snapshot.github.username
    )
  }

  if (snapshot.leetcode) {
    user.leetcodeUsername = snapshot.leetcode.username
    if (!user.avatarUrl && snapshot.leetcode.avatarUrl) user.avatarUrl = snapshot.leetcode.avatarUrl
    user.leetcodeSolved = snapshot.leetcode.totalSolved
    user.leetcodeEasySolved = snapshot.leetcode.easySolved
    user.leetcodeMediumSolved = snapshot.leetcode.mediumSolved
    user.leetcodeHardSolved = snapshot.leetcode.hardSolved

    await processHistory(
      snapshot.leetcode.history,
      'leetcode',
      'leetcode_easy',
      (c) => `Synced ${c} solved LeetCode problem${c === 1 ? '' : 's'}`,
      snapshot.leetcode.username
    )
  }

  if (historyUpdated) {
    // Recalculate streak from logs
    const dailyLogs = await DailyActivityLog.find({ userId: user._id }).lean()
    const mappedLogs = dailyLogs.map((log) => ({
      date: log.date,
      hasActivity: log.hasActivity
    }))
    
    const { currentStreak, bestStreak } = recalculateAllStreaks(mappedLogs)

    user.currentStreak = currentStreak
    user.longestStreak = bestStreak
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
