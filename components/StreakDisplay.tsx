"use client"

import { Flame, Calendar } from "lucide-react";
import { useEffect, useState } from 'react'

export function StreakDisplay() {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [completedDays, setCompletedDays] = useState<boolean[]>([])

  useEffect(() => {
    async function load() {
      try {
        const sres = await fetch('/api/stats')
        if (sres.ok) {
          const json = await sres.json()
          if (json?.ok && json.stats) {
            setCurrentStreak(json.stats.currentStreak ?? 0)
            setLongestStreak(json.stats.longestStreak ?? 0)
          }
        }
      } catch {}

      try {
        const year = new Date().getFullYear()
        const hres = await fetch(`/api/heatmap?year=${year}`)
        if (hres.ok) {
          const j = await hres.json()
          const heatmap = j?.heatmap ?? j?.data
          if (j?.ok && Array.isArray(heatmap)) {
            const today = new Date()
            const last7 = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(today)
              d.setDate(d.getDate() - (6 - i))
              return d.toISOString().split('T')[0]
            })
            const map = new Map<string, number>()
            heatmap.forEach((p: { date: string; count: number }) => map.set(p.date, p.count))
            setCompletedDays(last7.map(d => (map.get(d) ?? 0) > 0))
          }
        }
      } catch {
        setCompletedDays([false, false, false, false, false, false, false])
      }
    }
    load()
    window.addEventListener('activity:logged', load)
    return () => window.removeEventListener('activity:logged', load)
  }, [])

  const today = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className={`w-6 h-6 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          <h2 className="text-lg font-semibold text-gray-900">Current Streak</h2>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${currentStreak > 0 ? 'text-orange-600' : 'text-gray-500'}`}>{currentStreak}</p>
          <p className="text-sm text-gray-500">days</p>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        {last7Days.map((date, index) => {
          const isToday = date.toDateString() === today.toDateString();
          const isCompleted = completedDays[index] ?? false;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center mb-1 transition-all ${isCompleted
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                  } ${isToday ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
              >
                {isCompleted ? (
                  <Flame className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs text-gray-500">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>

      {currentStreak > 0 && currentStreak >= longestStreak ? (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-800 text-center font-medium">
            🔥 You are on your best streak yet! Keep the flame burning!
          </p>
        </div>
      ) : currentStreak > 0 ? (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-800 text-center">
            Keep it up! You are {Math.max(0, longestStreak - currentStreak)} days away from your best streak!
          </p>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 text-center">
            Log an activity today to start your streak!
          </p>
        </div>
      )}
    </div>
  );
}
