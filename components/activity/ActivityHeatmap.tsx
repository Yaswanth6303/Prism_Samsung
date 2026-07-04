"use client"

import { useEffect, useState } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { apiFetch } from '@/lib/api/fetch'
import {type HeatmapPoint, type ActivityCacheEntry} from "@/types"
import { ActivitiesResponseSchema, HeatmapResponseSchema } from "@/types/api"


// type HeatmapPoint = { date: string; count: number; activities?: string[] }
// type ActivityCacheEntry = { status: 'idle' | 'loading' | 'loaded' | 'error'; activities: string[] }

export function ActivityHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([])
  const [activityCache, setActivityCache] = useState<Record<string, ActivityCacheEntry>>({})

  useEffect(() => {
    async function load() {
      try {
        const year = new Date().getFullYear()
        const data = await apiFetch(`/api/heatmap?year=${year}`, HeatmapResponseSchema)
        setHeatmapData(data.data)
      } catch {
        // fallback empty on any error
        setHeatmapData([])
      }
    }
    void load()
  }, [])

  async function loadActivitiesForDate(date: string) {
    if (activityCache[date]?.status === 'loading' || activityCache[date]?.status === 'loaded') {return}

    setActivityCache((current) => ({
      ...current,
      [date]: { status: 'loading', activities: current[date]?.activities ?? [] },
    }))

    try {
      const data = await apiFetch(
        `/api/activities?date=${date}&limit=100`,
        ActivitiesResponseSchema,
      )
      const activities = data.activities
        .map((activity) => activity.title)
        .filter((title) => title.trim().length > 0)

      setActivityCache((current) => ({
        ...current,
        [date]: { status: 'loaded', activities },
      }))
    } catch {
      setActivityCache((current) => ({
        ...current,
        [date]: { status: 'error', activities: [] },
      }))
    }
  }

  const getColor = (count: number) => {
    if (count === 0) {return 'bg-muted dark:bg-muted';}
    if (count <= 2) {return 'bg-emerald-200';}
    if (count <= 4) {return 'bg-emerald-400';}
    if (count <= 6) {return 'bg-teal-500';}
    return 'bg-cyan-700';
  };

  const heatmapMap = new Map<string, number>();
  heatmapData.forEach((d) => heatmapMap.set(d.date, d.count));

  // Build a days array aligned to week columns starting on Sunday,
  // covering the current year starting from January.
  const days: HeatmapPoint[] = [];
  const today = new Date();
  const CELL = 11;
  const GAP = 3;
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Start from Jan 1st of the current year
  // Start exactly from Jan 1st of the current year
  const start = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31);

  // Pad the first week if Jan 1st isn't a Sunday
  const startOffset = start.getDay();
  for (let i = 0; i < startOffset; i++) {
    days.push({ date: `pad-start-${i}`, count: -1 });
  }

  // Helper to get local YYYY-MM-DD
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Add all days of the year
  for (let d = new Date(start); d <= endOfYear; d.setDate(d.getDate() + 1)) {
    const localIso = getLocalDateString(d);
    days.push({ date: localIso, count: heatmapMap.get(localIso) ?? 0 });
  }

  // Pad the last week if Dec 31st isn't a Saturday
  const endOffset = endOfYear.getDay();
  for (let i = endOffset + 1; i <= 6; i++) {
    days.push({ date: `pad-end-${i}`, count: -1 });
  }

  // Pad the last week to always have 7 days for the grid
  while (days.length % 7 !== 0) {
    const lastDateStr = days[days.length - 1].date;
    const lastDate = new Date(`${lastDateStr}T12:00:00Z`); // parse safely
    lastDate.setUTCDate(lastDate.getUTCDate() + 1);
    
    const year = lastDate.getUTCFullYear();
    const month = String(lastDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(lastDate.getUTCDate()).padStart(2, '0');
    const localIso = `${year}-${month}-${day}`;
    
    days.push({ date: localIso, count: heatmapMap.get(localIso) ?? 0 });
  }

  const weeks: HeatmapPoint[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthLabels: { month: string; position: number }[] = [];
  let currentMonth = '';
  // We'll compute labels for the columns we render
  weeks.forEach((week, i) => {
    if (!week || week.length === 0) {return;}
    const firstValidDay = week.find((d) => d.count !== -1);
    if (!firstValidDay) {return;}
    const date = new Date(firstValidDay.date);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    if (month !== currentMonth) {
      monthLabels.push({ month, position: i });
      currentMonth = month;
    }
  });

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5 sm:p-6 mb-6 overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-lg font-semibold text-foreground">Activity Heatmap</h2>
        <p className="text-xs font-medium text-muted-foreground">This year</p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="mx-auto w-fit min-w-max">
          {/* Month labels */}
          <div className="relative mb-2 ml-9" style={{ height: 18 }}>
            {monthLabels.map(({ month, position }) => (
              <div
                key={position}
                style={{ marginLeft: position * (CELL + GAP), position: 'absolute', left: 0, top: 0 }}
                className="text-[11px] font-medium text-slate-400"
              >
                {month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex" style={{ gap: GAP }}>
            {/* Day labels */}
            <div className="flex flex-col mr-2" style={{ gap: GAP }}>
              {dayLabels.map((label) => (
                <div
                  key={label}
                  className="w-7 text-[10px] font-medium leading-none text-slate-400 flex items-center"
                  style={{ height: CELL }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks (columns) - render full grid; weeks is already aligned starting Sundays */}
            {weeks.map((week, weekIndex) => (
              <div key={`week-${week[0]?.date || weekIndex}`} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((day) => (
                  day.count === -1 ? (
                    <div
                      key={day.date}
                      style={{ width: CELL, height: CELL }}
                      className="opacity-0 pointer-events-none"
                    />
                  ) : (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <div
                          onMouseEnter={() => { void loadActivitiesForDate(day.date) }}
                          style={{ width: CELL, height: CELL }}
                          className={`${getColor(day.count)} rounded-[3px] ring-1 ring-inset ring-white/70 hover:scale-125 hover:ring-slate-500 cursor-pointer transition-transform`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="max-w-xs border border-border bg-popover text-popover-foreground shadow-md">
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold">{day.date}</div>
                          <div className="text-xs text-muted-foreground">
                            {day.count} {day.count === 1 ? 'activity' : 'activities'}
                          </div>
                          <div className="space-y-1">
                            {(() => {
                              const cacheEntry = activityCache[day.date];
                              if (cacheEntry?.status === 'loaded' && cacheEntry.activities.length > 0) {
                                return cacheEntry.activities.map((activity) => (
                                  <div key={activity} className="text-xs leading-snug">
                                    {activity}
                                  </div>
                                ));
                              }
                              if (cacheEntry?.status === 'loading') {
                                return <div className="text-xs leading-snug text-muted-foreground">Loading activities...</div>;
                              }
                              if (day.activities && day.activities.length > 0) {
                                return day.activities.map((activity) => (
                                  <div key={activity} className="text-xs leading-snug">
                                    {activity}
                                  </div>
                                ));
                              }
                              return <div className="text-xs leading-snug text-muted-foreground">No activities recorded.</div>;
                            })()}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-[3px] bg-slate-100 ring-1 ring-inset ring-slate-200" />
              <div className="w-3 h-3 rounded-[3px] bg-emerald-200" />
              <div className="w-3 h-3 rounded-[3px] bg-emerald-400" />
              <div className="w-3 h-3 rounded-[3px] bg-teal-500" />
              <div className="w-3 h-3 rounded-[3px] bg-cyan-700" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
