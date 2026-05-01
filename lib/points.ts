export const POINTS = {
  github_commit: 5,
  github_pr: 20,
  leetcode_easy: 10,
  leetcode_medium: 25,
  leetcode_hard: 50,
  gym_session: 15,
  jog_per_km: 2,
  custom: 10,
} as const

export type PointEvent = keyof typeof POINTS

export function pointsFor(event: PointEvent, value = 1) {
  if (event === 'jog_per_km') return POINTS.jog_per_km * value
  return POINTS[event]
}
