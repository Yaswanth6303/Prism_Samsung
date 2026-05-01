export type DailyLog = {
  userId: string
  date: string
  hasActivity: boolean
  totalCount: number
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function prevDateKey(date: Date) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() - 1)
  return dateKey(d)
}

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
