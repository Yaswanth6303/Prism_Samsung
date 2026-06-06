import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import connectToDB from '@/lib/db/mongoose'
import { Activity } from '@/lib/db/models/Activity'
import { DailyActivityLog } from '@/lib/db/models/DailyActivityLog'
import { User } from '@/lib/db/models/User'
import { fetchGitHubSnapshot, fetchLeetCodeSnapshot, type PlatformSnapshot } from '@/lib/integrations/platform-sync'
import { pointsFor } from '@/lib/services/points'
import { recalculateAllStreaks } from '@/lib/services/streak'
import { decrypt } from '@/lib/services/encryption'
import { db } from '@/lib/db/mongo-client'

// This endpoint pulls the user's external activity into our local database.
// Keeping the flow inside one route makes sync predictable and easy to audit.
export async function POST(request: Request) {
  // Only signed-in users are allowed to trigger a sync.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // We need the database connection before we can read or update the profile.
  await connectToDB()
  const user = await User.findById(session.user.id)
  if (!user) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
  }

  // Snapshot stores the latest data pulled from each platform during this run.
  const snapshot: PlatformSnapshot = {}
  // Errors are collected instead of failing fast so one broken provider does not block the other.
  const errors: string[] = []
  // Results are returned to the caller so the UI can explain what actually happened.
  const results: Array<{ provider: 'github' | 'leetcode'; ok: boolean; message: string }> = []

  // If the profile does not already store a GitHub username, try to recover it from the linked OAuth account.
  let githubUsername = user.githubUsername
  if (!githubUsername) {
    try {
      // Better Auth keeps linked accounts in a separate collection, so we check there first.
      const accountsCollection = db.collection('account')
      const githubAccount = await accountsCollection.findOne({ userId: user._id.toString(), provider: 'github' })
      if (githubAccount?.accountId) {
        // For GitHub, accountId is the username we want to sync with.
        githubUsername = githubAccount.accountId
        // Save it now so future syncs do not need to rediscover it.
        user.githubUsername = githubUsername
      }
    } catch (e) {
      // If account lookup fails, we still let the rest of the sync continue.
    }
  }

  // GitHub sync only runs when we have a username to target.
  if (githubUsername) {
    try {
      // Decrypt the PAT only when we actually need it, so we keep secrets out of memory for as short a time as possible.
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

  // LeetCode sync follows the same pattern, but only runs when a username exists on the profile.
  if (user.leetcodeUsername) {
    try {
      // The optional token unlocks private history; without it we only read public data.
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

  // If no platform names are stored, there is nothing useful to sync yet.
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

  // This helper turns per-day history into dated Activity records and daily streak logs.
  const userId = user._id
  async function processHistory(
    history: Record<string, number>,
    type: 'github' | 'leetcode',
    pointType: 'github_commit' | 'leetcode_easy',
    titleFn: (count: number) => string,
    details: string
  ) {
    // Each day is handled independently so retries can safely update one record at a time.
    console.log(`[processHistory] Starting for ${type}, total days: ${Object.keys(history).length}`)
    for (const [dateStr, count] of Object.entries(history)) {
      if (count <= 0) continue

      // Normalize the day range so a contribution always lands on the correct calendar date.
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
      const expectedPoints = pointsFor(pointType, count)

      // Use an upsert so we create the activity once and avoid duplicate records on repeat syncs.
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

      // A fresh insert means this activity has never been counted before.
      // @ts-ignore - depending on the driver version, upsertedCount may be exposed differently.
      if (upsertResult && (upsertResult as any).upsertedCount > 0) {
        // The daily log is what powers streaks, so we keep it in step with the new activity.
        await DailyActivityLog.findOneAndUpdate(
          { userId: userId.toString(), date: dateStr },
          { $set: { hasActivity: true }, $inc: { totalCount: count } },
          { new: true, upsert: true }
        )
        pointsDelta += expectedPoints
        historyUpdated = true
      } else {
        // If the day already exists, only increase the score when the new history shows more work than before.
        const existing = await Activity.findOne(filter)
        if (existing) {
          const previousPoints = existing.points
          if (expectedPoints > previousPoints) {
            const addedPoints = expectedPoints - previousPoints
            const addedCount = count - Math.floor(previousPoints / pointsFor(pointType, 1))

            // Refresh the visible activity text so the title matches the newer total.
            await Activity.updateOne({ _id: existing._id }, { $set: { points: expectedPoints, title: titleFn(count) } })

            // Keep the daily total honest so streak math stays aligned with activity history.
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

  // GitHub data gets copied back onto the profile before its history is converted into Activity rows.
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

  // LeetCode follows the same shape: keep the profile summary fresh, then persist the dated history.
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

  // When history changes, recompute streaks from the log instead of trying to patch streak counts by hand.
  if (historyUpdated) {
    const dailyLogs = await DailyActivityLog.find({ userId: user._id }).lean()
    const mappedLogs = dailyLogs.map((log) => ({
      date: log.date,
      hasActivity: log.hasActivity
    }))

    const { currentStreak, bestStreak } = recalculateAllStreaks(mappedLogs)

    user.currentStreak = currentStreak
    user.longestStreak = bestStreak
  }

  // The total points reflect everything we newly awarded during this sync run.
  user.totalPoints += pointsDelta
  user.lastPlatformSyncAt = new Date()
  await user.save()

  // Return the snapshot and per-provider result list so the client can explain the outcome clearly.
  return NextResponse.json({
    ok: errors.length === 0 || Boolean(snapshot.github || snapshot.leetcode),
    snapshot,
    pointsAwarded: pointsDelta,
    results,
    errors,
  })
}
