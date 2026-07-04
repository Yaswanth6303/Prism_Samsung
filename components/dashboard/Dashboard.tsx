"use client"

import { useState, useEffect } from 'react'

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import {
  TrendingUp,
  Trophy,
  Code2,
  Dumbbell,
  Footprints,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";


const StreakDisplay = dynamic(() => import('../streak/StreakDisplay').then(m => ({ default: m.StreakDisplay })), { ssr: false })

// import { Leaderboard } from '../leaderboard/Leaderboard'
// import { ClawMind } from '../study/ClawMind'
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/fetch";
import { ActivitiesResponseSchema, type ActivityItem, StatsResponseSchema } from "@/types/api";

import { ActivityCard } from "../activity/ActivityCard";
import { ActivityHeatmap } from "../activity/ActivityHeatmap";
import { GithubIcon } from "../icons/GithubIcon";

const statSurface =
  "rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm ring-1 ring-foreground/10";

// The dashboard pulls together the headline metrics, recent activity, and the main product shortcuts.
export function Dashboard() {
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    rank: 0,
    githubContributions: 0,
    leetcodeSolved: 0,
    gymSessions: 0,
    joggingDistance: 0,
    githubUsername: '',
    leetcodeUsername: '',
  })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load both the summary stats and the recent feed together so the page can hydrate as one coherent view.
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      // allSettled keeps one failing endpoint from blocking the rest of the dashboard.
      const [statsResult, activitiesResult] = await Promise.allSettled([
        apiFetch('/api/stats', StatsResponseSchema),
        apiFetch('/api/activities', ActivitiesResponseSchema),
      ])
      if (statsResult.status === 'fulfilled') {
        setStats((prev) => ({ ...prev, ...statsResult.value.stats }))
      }
      if (activitiesResult.status === 'fulfilled') {
        setActivities(activitiesResult.value.activities.slice(0, 5))
      }
      setIsLoading(false)
    }
    void load()
  }, [])

  // Skeletons keep the layout stable while data is loading so the page does not jump around.
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-[88px] sm:h-[104px] w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Skeleton className="h-[72px] sm:h-[90px] w-full rounded-xl" />
          <Skeleton className="h-[72px] sm:h-[90px] w-full rounded-xl" />
          <Skeleton className="h-[72px] sm:h-[90px] w-full rounded-xl" />
          <Skeleton className="h-[72px] sm:h-[90px] w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-[38px] w-[100px] rounded-xl" />
            <Skeleton className="h-[38px] w-[100px] rounded-xl" />
            <Skeleton className="h-[38px] w-[100px] rounded-xl" />
          </div>
        </div>
        <div className="grid gap-4 lg:col-span-2">
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
      {/* The ClawMind card is a shortcut into the AI study tools because it is one of the main value props. */}
      <Link href="/study" className="block mb-4 sm:mb-6">
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl p-4 sm:p-6 text-white hover:shadow-lg transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl shrink-0">
                <BrainCircuit className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-1">ClawMind</h2>
                <p className="text-indigo-100 text-xs sm:text-sm">
                  AI-powered study assistant with Notes, Quizzes and Whiteboard
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 shrink-0" />
          </div>
        </div>
      </Link>

      {/* These top metrics answer the user's first question: how am I doing overall? */}
      <div id="tour-dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className={statSurface}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400 shrink-0">
              <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Total Points</p>
              <p className="text-lg sm:text-2xl font-semibold text-foreground">{stats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className={statSurface}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/15 text-orange-600 dark:bg-orange-500/25 dark:text-orange-400 shrink-0">
              <Image src="/fire.png?v=2" alt="Fire" width={24} height={24} className="w-5 sm:w-6 h-5 sm:h-6 object-contain drop-shadow-md" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Current Streak</p>
              <p className="text-lg sm:text-2xl font-semibold text-foreground">{stats.currentStreak}</p>
            </div>
          </div>
        </div>

        <div className={statSurface}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/15 text-purple-600 dark:bg-purple-500/25 dark:text-purple-400 shrink-0">
              <Trophy className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Global Rank</p>
              <p className="text-lg sm:text-2xl font-semibold text-foreground">#{stats.rank}</p>
            </div>
          </div>
        </div>

        <div className={statSurface}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400 shrink-0">
              <Image src="/fire.png?v=2" alt="Fire" width={24} height={24} className="w-5 sm:w-6 h-5 sm:h-6 object-contain drop-shadow-md" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Best Streak</p>
              <p className="text-lg sm:text-2xl font-semibold text-foreground">{stats.longestStreak}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequent activities highlight the user's most common effort so progress is easier to spot. */}
      {(() => {
        const freqStats = [
          { id: 'github', label: 'GitHub', value: stats.githubContributions, unit: 'commits', icon: GithubIcon, colorClass: 'text-gray-700 dark:text-gray-300', url: stats.githubUsername ? `https://github.com/${stats.githubUsername}` : null },
          { id: 'leetcode', label: 'LeetCode', value: stats.leetcodeSolved, unit: 'problems', icon: Code2, colorClass: 'text-yellow-600 dark:text-yellow-500', url: stats.leetcodeUsername ? `https://leetcode.com/u/${stats.leetcodeUsername}` : null },
          { id: 'gym', label: 'Gym', value: stats.gymSessions, unit: 'sessions', icon: Dumbbell, colorClass: 'text-blue-600 dark:text-blue-500', url: null },
          { id: 'jogging', label: 'Jogging', value: stats.joggingDistance, unit: 'km', icon: Footprints, colorClass: 'text-green-600 dark:text-green-500', url: null }
        ].filter(s => s.value > 0).sort((a, b) => b.value - a.value);

        if (freqStats.length === 0) {return null;}

        return (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Frequent Activities</h3>
            <div className="flex flex-wrap gap-3">
              {freqStats.map((stat) => {
                const Icon = stat.icon;
                const Wrapper = stat.url ? 'a' : 'div';
                const wrapperProps = stat.url ? { href: stat.url, target: '_blank', rel: 'noopener noreferrer' } : {};

                return (
                  <Wrapper
                    key={stat.id}
                    {...wrapperProps}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-border bg-card shadow-sm ring-1 ring-foreground/5 ${stat.url ? 'hover:bg-muted/50 cursor-pointer transition-colors' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${stat.colorClass}`} />
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-medium text-foreground text-sm">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.unit}</span>
                    </div>
                  </Wrapper>
                )
              })}
            </div>
          </div>
        );
      })()}

      {/* The streak and heatmap area gives a visual history of consistency, not just totals. */}
      <div id="tour-streak-calendar" className="lg:col-span-2">
        <StreakDisplay />
        <ActivityHeatmap />
      </div>

      {/* Recent activity cards make the dashboard feel current instead of summary-only. */}
      {activities.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 text-card-foreground shadow-sm ring-1 ring-foreground/10 mt-4 sm:mt-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
