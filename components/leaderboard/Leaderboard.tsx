"use client"

import { useEffect, useState } from 'react'

import { Medal, Trophy, RefreshCcw } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/fetch";
import {type LeaderboardEntry} from "@/types"
import { LeaderboardResponseSchema, MyRankResponseSchema } from "@/types/api"
// type LeaderboardEntry = {
//   userId?: string
//   rank: number
//   name: string
//   totalPoints: number
//   currentStreak: number
//   department?: string
//   avatar: string
//   isCurrentUser: boolean
// }

function field(record: Record<string, unknown>, key: string) {
  return record[key]
}

// The leaderboard accepts multiple backend shapes, so these helpers normalize the data before rendering.
function textField(record: Record<string, unknown>, key: string) {
  const value = field(record, key)
  return typeof value === 'string' ? value : undefined
}

// Numbers may arrive from different fields depending on the source, so we pick the first useful value.
function numberField(record: Record<string, unknown>, key: string) {
  const value = field(record, key)
  return typeof value === 'number' ? value : undefined
}

// Initials keep the podium readable even when no avatar image exists.
function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

// Convert arbitrary leaderboard payloads into one stable view model for the UI.
function normalizeEntry(entry: unknown, index: number): LeaderboardEntry {
  const record = typeof entry === 'object' && entry !== null ? entry as Record<string, unknown> : {}
  const isCurrentUser = field(record, 'isCurrentUser') === true
  const name = textField(record, 'name') || (isCurrentUser ? 'You' : 'Student')

  return {
    userId: textField(record, 'userId') ?? textField(record, '_id'),
    rank: numberField(record, 'rank') ?? index + 1,
    name,
    totalPoints: numberField(record, 'totalPoints') ?? numberField(record, 'points') ?? numberField(record, 'score') ?? 0,
    currentStreak: numberField(record, 'currentStreak') ?? 0,
    department: textField(record, 'department'),
    avatar: textField(record, 'avatar') ?? initials(name),
    isCurrentUser,
  }
}

// The podium highlights the top ranks so the first few entries feel distinct from the rest of the list.
function PodiumEntry({ entry, place }: { entry: LeaderboardEntry; place: 'first' | 'side' }) {
  const isFirst = place === 'first'

  return (
    <div className={`flex flex-col items-center ${isFirst ? 'sm:-mt-4' : 'sm:pt-8'}`}>
      <div className="relative">
        <div
          className={`${isFirst ? 'w-20 h-20 bg-amber-300 text-amber-950' : 'w-16 h-16 bg-muted text-muted-foreground'} rounded-full flex items-center justify-center text-lg font-semibold ring-4 ring-background shadow-sm`}
        >
          {entry.avatar}
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border">
          #{entry.rank}
        </div>
      </div>
      <div className={`${isFirst ? 'mt-6 text-lg' : 'mt-5 text-sm'} max-w-36 truncate font-medium text-foreground`}>
        {entry.isCurrentUser ? 'You' : entry.name}
      </div>
      <div className="text-xs text-muted-foreground">{entry.department || `${entry.currentStreak} day streak`}</div>
      <div className={`${isFirst ? 'text-lg' : ''} mt-2 font-semibold text-blue-600`}>{entry.totalPoints} pts</div>
    </div>
  )
}

export function Leaderboard() {
  const [list, setList] = useState<LeaderboardEntry[]>([])
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    // Fetch the signed-in user's own rank first so the personal result appears as soon as possible.
    const loadUserRank = async () => {
      try {
        const data = await apiFetch('/api/leaderboard/my-rank', MyRankResponseSchema)
        setUserEntry(normalizeEntry(data.userEntry, 0))
      } catch {
        // silently fail
      }
    }

    // The full leaderboard is fetched in parallel because it is useful, but not required for first paint.
    const loadFullLeaderboard = async () => {
      setLoading(true)
      try {
        const data = await apiFetch('/api/leaderboard', LeaderboardResponseSchema)
        setList(data.leaderboard.map(normalizeEntry))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    // Running both requests together keeps the overall wait time lower.
    setInitialLoading(true)
    void Promise.all([loadUserRank(), loadFullLeaderboard()]).finally(() =>
      setInitialLoading(false),
    )
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/leaderboard', LeaderboardResponseSchema)
      setList(data.leaderboard.map(normalizeEntry))
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const entries = list
  const podiumEntries = [
    { entry: entries[1], place: 'side' as const, className: 'order-2 sm:order-1' },
    { entry: entries[0], place: 'first' as const, className: entries.length === 1 ? 'order-1 sm:order-2 sm:col-start-2' : 'order-1 sm:order-2' },
    { entry: entries[2], place: 'side' as const, className: 'order-3' },
  ].filter((item) => item.entry)

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 h-[104px]">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="p-4 sm:p-6 border-b border-border">
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-8 w-16 ml-auto" />
                <Skeleton className="h-3 w-10 ml-auto" />
              </div>
            </div>
          </div>
          <div className="p-6 h-[500px]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-6">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <div className="max-w-2xl mx-auto space-y-2 mt-10">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="tour-leaderboard" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
        {/* The header frames the leaderboard as a competition view and gives the user a quick refresh action. */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2 justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <h1 className="text-2xl font-semibold">Global Leaderboard</h1>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh leaderboard"
            >
              <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-blue-100">Top performers this month</p>
        </div>

        {/* The personal rank card lets the user compare themselves without hunting through the whole table. */}
        {userEntry && (
          <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900 p-4 sm:p-6">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-3">Your Rank</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                  {userEntry.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{userEntry.name}</p>
                  <p className="text-sm text-muted-foreground">#{userEntry.rank} • {userEntry.currentStreak} day streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{userEntry.totalPoints}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </div>
        )}

        {/* The podium gives the top three extra visual weight because that is the part people notice first. */}
        <div className="p-6 bg-gradient-to-b from-muted/50 to-card">
          {entries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {podiumEntries.map(({ entry, place, className }) => (
                <div key={entry.userId ?? entry.rank} className={className}>
                  <PodiumEntry entry={entry} place={place} />
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <Medal className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="font-medium text-foreground">No rankings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Earn your first points to claim #1.</p>
            </div>
          )}

          {/* The remaining list keeps the rest of the rankings compact and scannable. */}
          <div className="mt-6 max-w-2xl mx-auto space-y-2">
            {entries.slice(3).map((entry) => (
              <div key={entry.userId ?? entry.rank} className="flex items-center justify-between border border-border p-3 rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">{entry.avatar}</div>
                  <div>
                    <div className="font-medium text-foreground">{entry.isCurrentUser ? 'You' : entry.name}</div>
                    <div className="text-xs text-muted-foreground">#{entry.rank} - {entry.department || `${entry.currentStreak} day streak`}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-foreground/80">{entry.totalPoints} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
