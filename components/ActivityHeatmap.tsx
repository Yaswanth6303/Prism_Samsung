"use client"

import { useEffect, useState } from 'react'

type HeatmapPoint = { date: string; count: number }

export function ActivityHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([])

  useEffect(() => {
    async function load() {
      try {
        const year = new Date().getFullYear()
        const res = await fetch(`/api/heatmap?year=${year}`)
        if (res.ok) {
          const json = await res.json()
          const data = json?.heatmap ?? json?.data
          if (json?.ok && Array.isArray(data)) {
            setHeatmapData(data)
            return
          }
        }
      } catch {}
      // fallback empty
      setHeatmapData([])
    }
    load()
  }, [])

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count <= 2) return 'bg-emerald-200';
    if (count <= 4) return 'bg-emerald-400';
    if (count <= 6) return 'bg-teal-500';
    return 'bg-cyan-700';
  };

  // Build a continuous past-year day grid (52 weeks x 7 days).
  // This ensures we always render a full grid (gray when counts are 0),
  // similar to GitHub's activity heatmap.

  const heatmapMap = new Map<string, number>();
  heatmapData.forEach((d) => heatmapMap.set(d.date, d.count));

  // Build a days array aligned to week columns starting on Sunday,
  // covering the last 52 weeks (includes today).
  const days: HeatmapPoint[] = [];
  const today = new Date();
  const weeksCount = 52;
  const CELL = 11;
  const GAP = 3;
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Start from weeksCount weeks ago, align to previous Sunday so columns are full weeks
  const start = new Date(today);
  start.setDate(start.getDate() - weeksCount * 7 + 1);
  const offset = start.getDay();
  start.setDate(start.getDate() - offset);

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: iso, count: heatmapMap.get(iso) ?? 0 });
  }

  const weeks: HeatmapPoint[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthLabels: { month: string; position: number }[] = [];
  let currentMonth = '';
  // We'll compute labels for the last `weeksCount` columns we render
  const renderedWeeks = weeks.slice(-weeksCount);
  renderedWeeks.forEach((week, i) => {
    if (!week || week.length === 0) return;
    const date = new Date(week[0].date); // Sunday of the week
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    if (month !== currentMonth) {
      monthLabels.push({ month, position: i });
      currentMonth = month;
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 mb-6 overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Activity Heatmap</h2>
        <p className="text-xs font-medium text-slate-500">Past year</p>
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
          {weeks.slice(-weeksCount).map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((day) => (
                <div
                  key={day.date}
                  style={{ width: CELL, height: CELL }}
                  className={`${getColor(day.count)} rounded-[3px] ring-1 ring-inset ring-white/70 hover:scale-125 hover:ring-slate-500 cursor-pointer transition-transform`}
                  title={`${day.date}: ${day.count} activities`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-[3px] bg-slate-100 ring-1 ring-inset ring-slate-200"></div>
            <div className="w-3 h-3 rounded-[3px] bg-emerald-200"></div>
            <div className="w-3 h-3 rounded-[3px] bg-emerald-400"></div>
            <div className="w-3 h-3 rounded-[3px] bg-teal-500"></div>
            <div className="w-3 h-3 rounded-[3px] bg-cyan-700"></div>
          </div>
          <span>More</span>
        </div>
        </div>
      </div>
    </div>
  );
}
