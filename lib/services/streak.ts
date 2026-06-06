export type DailyLog = {
  userId: string
  date: string
  hasActivity: boolean
  totalCount: number
}

// Keep date comparisons in UTC so streak logic does not drift across time zones.
function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

// Streaks only care about yesterday's date, so we derive it once in a single place.
function prevDateKey(date: Date) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() - 1)
  return dateKey(d)
}

// This incremental updater is used when we only need to know whether today's activity extends a streak.
export function updateStreakFromLogs(input: {
  userId: string
  logs: DailyLog[]
  currentStreak: number
  bestStreak: number
  today?: Date
}) {
  const today = input.today || new Date()
  const todayKey = dateKey(today)
  const yesterdayKey = prevDateKey(today)

  const hasToday = input.logs.some((l) => l.userId === input.userId && l.date === todayKey && l.hasActivity)
  if (!hasToday) {
    return { currentStreak: input.currentStreak, bestStreak: input.bestStreak }
  }

  const hadYesterday = input.logs.some((l) => l.userId === input.userId && l.date === yesterdayKey && l.hasActivity)
  const currentStreak = hadYesterday ? input.currentStreak + 1 : 1
  const bestStreak = Math.max(input.bestStreak, currentStreak)

  return { currentStreak, bestStreak }
}

// Rebuild the best and current streaks from all known active dates.
export function recalculateAllStreaks(logs: { date: string; hasActivity: boolean }[]) {
  const activeDates = new Set(
    logs.filter(l => l.hasActivity).map(l => l.date)
  )

  const sortedDates = Array.from(activeDates).sort()

  let bestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  for (const dateStr of sortedDates) {
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffTime = d.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    lastDate = d;
  }

  let currentStreak = 0
  const todayKey = dateKey(new Date());
  const yesterdayKey = prevDateKey(new Date());
  
  if (lastDate) {
    const lastDateKey = dateKey(lastDate);
    if (lastDateKey === todayKey || lastDateKey === yesterdayKey) {
      currentStreak = tempStreak;
    }
  }

  return { currentStreak, bestStreak };
}
