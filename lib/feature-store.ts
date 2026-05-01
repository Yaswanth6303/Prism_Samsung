import { pointsFor } from '@/lib/points'

export type Metric = 'points' | 'github' | 'leetcode' | 'streak'
export type Period = 'alltime' | 'weekly' | 'monthly'
export type ActivityType = 'gym' | 'jog' | 'custom'

export type UserProfile = {
  userId: string
  name: string
  collegeId: string
  totalPoints: number
  githubPoints: number
  leetcodePoints: number
  currentStreak: number
  bestStreak: number
}

export type ManualActivity = {
  id: string
  userId: string
  type: ActivityType
  label: string
  value: number
  unit?: string
  date: string
  pointsAwarded: number
  createdAt: string
}

export type ActivityEvent = {
  id: string
  userId: string
  platform: 'manual' | 'github' | 'leetcode' | 'ai'
  type: string
  title: string
  subtitle?: string
  metadata?: Record<string, unknown>
  pointsAwarded?: number
  createdAt: string
}

export type DailyActivityLog = {
  userId: string
  date: string
  hasActivity: boolean
  totalCount: number
}

export type Directory = {
  id: string
  userId: string
  name: string
  color?: string
  createdAt: string
}

export type Note = {
  id: string
  userId: string
  directoryId?: string
  title: string
  content: string
  tags: string[]
  createdAt: string
}

export type QuizQuestion = {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export type Quiz = {
  id: string
  noteId: string
  userId: string
  questions: QuizQuestion[]
  createdAt: string
}

const state = {
  users: new Map<string, UserProfile>(),
  manualActivities: [] as ManualActivity[],
  events: [] as ActivityEvent[],
  dailyLogs: [] as DailyActivityLog[],
  directories: [] as Directory[],
  notes: [] as Note[],
  quizzes: [] as Quiz[],
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function ensureUser(userId: string) {
  if (!state.users.has(userId)) {
    state.users.set(userId, {
      userId,
      name: userId === 'demo-user' ? 'Demo User' : userId,
      collegeId: 'default-college',
      totalPoints: 0,
      githubPoints: 0,
      leetcodePoints: 0,
      currentStreak: 0,
      bestStreak: 0,
    })
  }
  return state.users.get(userId)!
}

function upsertDailyLog(userId: string, day = dateKey()) {
  let log = state.dailyLogs.find((l) => l.userId === userId && l.date === day)
  if (!log) {
    log = { userId, date: day, hasActivity: true, totalCount: 0 }
    state.dailyLogs.push(log)
  }
  log.hasActivity = true
  log.totalCount += 1
  return log
}

function previousDay(day: string) {
  const d = new Date(`${day}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function updateStreak(userId: string, day = dateKey()) {
  const user = ensureUser(userId)
  const yesterday = previousDay(day)
  const hadYesterday = state.dailyLogs.some((l) => l.userId === userId && l.date === yesterday && l.hasActivity)
  user.currentStreak = hadYesterday ? user.currentStreak + 1 : 1
  user.bestStreak = Math.max(user.bestStreak, user.currentStreak)
}

export function addManualActivity(input: {
  userId: string
  type: ActivityType
  label?: string
  value?: number
  unit?: string
  date?: string
}) {
  const user = ensureUser(input.userId)
  const value = input.value ?? 1
  const eventType = input.type === 'gym' ? 'gym_session' : input.type === 'jog' ? 'jog_per_km' : 'custom'
  const pointsAwarded = pointsFor(eventType, value)
  const day = input.date || dateKey()

  const activity: ManualActivity = {
    id: id('act'),
    userId: input.userId,
    type: input.type,
    label: input.label || input.type,
    value,
    unit: input.unit,
    date: day,
    pointsAwarded,
    createdAt: new Date().toISOString(),
  }
  state.manualActivities.push(activity)

  const event: ActivityEvent = {
    id: id('evt'),
    userId: input.userId,
    platform: 'manual',
    type: input.type,
    title: `Manual activity: ${activity.label}`,
    subtitle: `${value}${input.unit ? ` ${input.unit}` : ''}`,
    metadata: { ...activity },
    pointsAwarded,
    createdAt: activity.createdAt,
  }
  state.events.push(event)

  upsertDailyLog(input.userId, day)
  updateStreak(input.userId, day)
  user.totalPoints += pointsAwarded

  return { activity, event, user }
}

export function getStats(userId: string) {
  const user = ensureUser(userId)
  const activityCount = state.events.filter((e) => e.userId === userId).length
  return {
    userId,
    totalPoints: user.totalPoints,
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    activityCount,
  }
}

export function getFeed(userId: string, limit = 25) {
  return state.events
    .filter((e) => e.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function getHeatmap(userId: string, year: number) {
  return state.dailyLogs
    .filter((l) => l.userId === userId && l.date.startsWith(`${year}-`))
    .map((l) => ({ date: l.date, count: l.totalCount }))
}

export function getLeaderboard(input: { metric: Metric; period: Period; collegeId?: string; userId?: string }) {
  const users = Array.from(state.users.values()).filter((u) => !input.collegeId || u.collegeId === input.collegeId)

  const scoreOf = (u: UserProfile) => {
    if (input.metric === 'github') return u.githubPoints
    if (input.metric === 'leetcode') return u.leetcodePoints
    if (input.metric === 'streak') return u.currentStreak
    return u.totalPoints
  }

  const ranked = users
    .map((u) => ({ userId: u.userId, name: u.name, score: scoreOf(u) }))
    .sort((a, b) => b.score - a.score)
    .map((u, i) => ({ ...u, rank: i + 1 }))

  const currentUser = input.userId ? ranked.find((r) => r.userId === input.userId) || null : null
  return { metric: input.metric, period: input.period, top: ranked.slice(0, 50), currentUser }
}

export function createDirectory(input: { userId: string; name: string; color?: string }) {
  ensureUser(input.userId)
  const directory: Directory = {
    id: id('dir'),
    userId: input.userId,
    name: input.name,
    color: input.color,
    createdAt: new Date().toISOString(),
  }
  state.directories.push(directory)
  return directory
}

export function listDirectories(userId: string) {
  ensureUser(userId)
  return state.directories.filter((d) => d.userId === userId)
}

export function createNote(input: { userId: string; directoryId?: string; title: string; content: string; tags?: string[] }) {
  ensureUser(input.userId)
  const note: Note = {
    id: id('note'),
    userId: input.userId,
    directoryId: input.directoryId,
    title: input.title,
    content: input.content,
    tags: input.tags || [],
    createdAt: new Date().toISOString(),
  }
  state.notes.push(note)
  state.events.push({
    id: id('evt'),
    userId: input.userId,
    platform: 'ai',
    type: 'note_generated',
    title: `Generated note: ${input.title}`,
    metadata: { noteId: note.id, directoryId: note.directoryId },
    createdAt: note.createdAt,
  })
  upsertDailyLog(input.userId)
  updateStreak(input.userId)
  return note
}

export function listNotes(userId: string) {
  ensureUser(userId)
  return state.notes
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function buildQuestionsFromNote(content: string): QuizQuestion[] {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10)

  return lines.map((line, idx) => ({
    question: `Q${idx + 1}. Which statement best matches this note line?`,
    options: [line, 'A contradictory statement', 'An unrelated fact', 'Insufficient context'],
    correctAnswer: line,
    explanation: 'The first option is directly sourced from your generated note.',
  }))
}

export function createQuizFromNote(input: { userId: string; noteId: string }) {
  ensureUser(input.userId)
  const note = state.notes.find((n) => n.id === input.noteId && n.userId === input.userId)
  if (!note) return null

  const quiz: Quiz = {
    id: id('quiz'),
    noteId: note.id,
    userId: input.userId,
    questions: buildQuestionsFromNote(note.content),
    createdAt: new Date().toISOString(),
  }
  state.quizzes.push(quiz)
  state.events.push({
    id: id('evt'),
    userId: input.userId,
    platform: 'ai',
    type: 'quiz_generated',
    title: `Generated quiz from note: ${note.title}`,
    metadata: { noteId: note.id, quizId: quiz.id },
    createdAt: quiz.createdAt,
  })
  upsertDailyLog(input.userId)
  updateStreak(input.userId)

  return quiz
}
