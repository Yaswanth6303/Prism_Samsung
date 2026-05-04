"use client"

import { useEffect, useState } from 'react'
import { Medal, Trophy, RefreshCcw } from "lucide-react";

type LeaderboardEntry = {
  userId?: string
  rank: number
  name: string
  totalPoints: number
  currentStreak: number
  department?: string
  avatar: string
  isCurrentUser: boolean
}

function field(record: Record<string, unknown>, key: string) {
  return record[key]
}

function textField(record: Record<string, unknown>, key: string) {
  const value = field(record, key)
  return typeof value === 'string' ? value : undefined
}

function numberField(record: Record<string, unknown>, key: string) {
  const value = field(record, key)
  return typeof value === 'number' ? value : undefined
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

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

function PodiumEntry({ entry, place }: { entry: LeaderboardEntry; place: 'first' | 'side' }) {
  const isFirst = place === 'first'

  return (
    <div className={`flex flex-col items-center ${isFirst ? 'sm:-mt-4' : 'sm:pt-8'}`}>
      <div className="relative">
        <div
          className={`${isFirst ? 'w-20 h-20 bg-amber-300 text-amber-950' : 'w-16 h-16 bg-slate-100 text-slate-700'} rounded-full flex items-center justify-center text-lg font-semibold ring-4 ring-white shadow-sm`}
        >
          {entry.avatar}
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          #{entry.rank}
        </div>
      </div>
      <div className={`${isFirst ? 'mt-6 text-lg' : 'mt-5 text-sm'} max-w-36 truncate font-medium text-slate-900`}>
        {entry.isCurrentUser ? 'You' : entry.name}
      </div>
      <div className="text-xs text-slate-500">{entry.department || `${entry.currentStreak} day streak`}</div>
      <div className={`${isFirst ? 'text-lg' : ''} mt-2 font-semibold text-blue-600`}>{entry.totalPoints} pts</div>
    </div>
  )
}

export function Leaderboard() {
  const [list, setList] = useState<LeaderboardEntry[]>([])
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch user's rank immediately (fast, single query)
    const loadUserRank = async () => {
      try {
        const res = await fetch('/api/leaderboard/my-rank')
        if (res.ok) {
          const json = await res.json()
          if (json?.ok && json?.userEntry) {
            setUserEntry(normalizeEntry(json.userEntry, 0))
          }
        }
      } catch {}
    }

    // Fetch full leaderboard in parallel (slower)
    const loadFullLeaderboard = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/leaderboard')
        if (res.ok) {
          const json = await res.json()
          const data = Array.isArray(json?.leaderboard) ? json.leaderboard : json?.leaderboard?.top
          if (json?.ok && Array.isArray(data)) {
            setList(data.map(normalizeEntry))
          }
        }
      } catch {}
      finally {
        setLoading(false)
      }
    }

    // Start both in parallel
    void loadUserRank()
    void loadFullLeaderboard()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leaderboard')
      if (!res.ok) return
      const json = await res.json()
      const data = Array.isArray(json?.leaderboard) ? json.leaderboard : json?.leaderboard?.top
      if (json?.ok && Array.isArray(data)) {
        setList(data.map(normalizeEntry))
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  const entries = list
  const podiumEntries = [
    { entry: entries[1], place: 'side' as const, className: 'order-2 sm:order-1' },
    { entry: entries[0], place: 'first' as const, className: entries.length === 1 ? 'order-1 sm:order-2 sm:col-start-2' : 'order-1 sm:order-2' },
    { entry: entries[2], place: 'side' as const, className: 'order-3' },
  ].filter((item) => item.entry)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Header */}
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

        {/* Your Rank Section */}
        {userEntry && (
          <div className="bg-blue-50 border-b border-blue-200 p-4 sm:p-6">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-3">Your Rank</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                  {userEntry.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userEntry.name}</p>
                  <p className="text-sm text-gray-600">#{userEntry.rank} • {userEntry.currentStreak} day streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{userEntry.totalPoints}</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
          {entries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {podiumEntries.map(({ entry, place, className }) => (
                <div key={entry.userId ?? entry.rank} className={className}>
                  <PodiumEntry entry={entry} place={place} />
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <Medal className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="font-medium text-slate-900">No rankings yet</p>
              <p className="mt-1 text-sm text-slate-500">Earn your first points to claim #1.</p>
            </div>
          )}

          {/* Remaining list */}
          <div className="mt-6 max-w-2xl mx-auto space-y-2">
            {entries.slice(3).map((entry) => (
              <div key={entry.userId ?? entry.rank} className="flex items-center justify-between border border-slate-200 p-3 rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">{entry.avatar}</div>
                  <div>
                    <div className="font-medium text-slate-900">{entry.isCurrentUser ? 'You' : entry.name}</div>
                    <div className="text-xs text-slate-500">#{entry.rank} - {entry.department || `${entry.currentStreak} day streak`}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700">{entry.totalPoints} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
