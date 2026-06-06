type GitHubUserResponse = {
  login: string
  name?: string
  avatar_url?: string
  html_url?: string
  public_repos?: number
  followers?: number
}

type GitHubEvent = {
  type?: string
  created_at?: string
  payload?: {
    commits?: unknown[]
    action?: string
  }
}

type LeetCodeMatchedUser = {
  username: string
  submitStatsGlobal?: {
    acSubmissionNum?: Array<{
      difficulty: string
      count: number
    }>
  }
    profile?: {
      realName?: string
      userAvatar?: string
      ranking?: number
    }
    userCalendar?: {
      submissionCalendar?: string
    }
  }

// The platform snapshot is the normalized shape the rest of the app understands.
export type PlatformSnapshot = {
  github?: {
    username: string
    name?: string
    avatarUrl?: string
    profileUrl?: string
    publicRepos: number
    followers: number
    recentContributions: number
    history: Record<string, number>
  }
  leetcode?: {
    username: string
    realName?: string
    avatarUrl?: string
    ranking?: number
    totalSolved: number
    easySolved: number
    mediumSolved: number
    hardSolved: number
    history: Record<string, number>
  }
}

// Small guard so fetch failures read like service errors instead of generic network noise.
function assertOk(response: Response, service: string) {
  if (!response.ok) {
    throw new Error(`${service} returned ${response.status}`)
  }
}

// GitHub GraphQL is only used when we have a token, because it gives the cleanest day-by-day contribution history.
async function fetchGitHubGraphQLHistory(username: string, pat: string): Promise<Record<string, number>> {
  const history: Record<string, number> = {}
  try {
    // GitHub's contribution calendar only needs the last year, so we keep the window tight.
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()
    const to = now.toISOString()

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat}`,
      },
      body: JSON.stringify({
        query: `
          query($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
              contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { username, from, to },
      }),
    })

    if (!response.ok) return history
    const json = await response.json() as any
    const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []
    for (const week of weeks) {
      for (const day of week.contributionDays ?? []) {
        if (day.contributionCount > 0) {
          history[day.date] = day.contributionCount
        }
      }
    }
  } catch (error) {
    console.error('GitHub GraphQL fetch failed:', error)
  }
  return history
}

// Build a single GitHub snapshot so the caller does not need to merge REST and GraphQL details itself.
export async function fetchGitHubSnapshot(username: string, pat?: string) {
  const cleanUsername = username.trim()
  // The public REST API gives us profile basics even when no token is available.
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (pat) headers.Authorization = `Bearer ${pat}`

  const [userResponse, eventsResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, { headers, cache: 'no-store' }),
    fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/events/public?per_page=100`, { headers, cache: 'no-store' }),
  ])

  assertOk(userResponse, 'GitHub profile')
  const user = await userResponse.json() as GitHubUserResponse

  let recentContributions = 0
  let history: Record<string, number> = {}

  // When a PAT is present, GraphQL gives us the more complete contribution calendar.
  if (pat) {
    history = await fetchGitHubGraphQLHistory(cleanUsername, pat)
    recentContributions = Object.values(history).reduce((sum, c) => sum + c, 0)
  }

  // REST events are a fallback and a lightweight way to keep contribution counts fresh.
  if (eventsResponse.ok) {
    const events = await eventsResponse.json() as GitHubEvent[]
    events.forEach(event => {
      let count = 0
      if (event.type === 'PushEvent') count = (event.payload?.commits?.length || 1)
      if (event.type === 'PullRequestEvent' && ['opened', 'closed', 'reopened'].includes(event.payload?.action || '')) count = 1
      if (event.type === 'IssuesEvent' && event.payload?.action === 'opened') count = 1
      
      if (count > 0 && event.created_at) {
        const date = event.created_at.split('T')[0]
        // Only add REST data if GraphQL didn't already cover it (GraphQL is authoritative)
        if (!pat) {
          recentContributions += count
          history[date] = (history[date] || 0) + count
        }
      }
    })
  }
    // Return the exact shape the sync route expects, so persistence stays simple.

  return {
    username: user.login || cleanUsername,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    publicRepos: user.public_repos ?? 0,
    followers: user.followers ?? 0,
    recentContributions,
    history,
  }
}

// LeetCode follows the same idea: one normalized snapshot with summary stats plus a date history.
export async function fetchLeetCodeSnapshot(username: string, authToken?: string) {
  const cleanUsername = username.trim()
  // These headers make the request look like a normal browser session, which LeetCode expects.
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    referer: 'https://leetcode.com',
    'user-agent': 'Mozilla/5.0 PrismSamsung/1.0',
  }
  if (authToken) {
    headers.Cookie = `LEETCODE_SESSION=${authToken}`
  }

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            profile {
              realName
              userAvatar
              ranking
            }
            userCalendar {
              submissionCalendar
            }
          }
        }
      `,
      variables: { username: cleanUsername },
    }),
  })

  assertOk(response, 'LeetCode profile')
  const payload = await response.json() as { data?: { matchedUser?: LeetCodeMatchedUser | null }; errors?: Array<{ message?: string }> }
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).filter(Boolean).join(', ') || 'LeetCode query failed')
  }
  const user = payload.data?.matchedUser
  if (!user) throw new Error('LeetCode user not found')

  // We keep solved counts in a map so the final return object can read naturally.
  const solved = new Map((user.submitStatsGlobal?.acSubmissionNum ?? []).map((item) => [item.difficulty, item.count]))

  const history: Record<string, number> = {}
  if (user.userCalendar?.submissionCalendar) {
    try {
      // LeetCode stores the calendar as JSON keyed by Unix timestamps, so we convert it to YYYY-MM-DD.
      const cal = JSON.parse(user.userCalendar.submissionCalendar)
      for (const [timestamp, count] of Object.entries(cal)) {
        const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0]
        history[date] = (history[date] || 0) + (count as number)
      }
    } catch (e) {}
  }

  // The caller only needs this clean summary object, not the raw LeetCode payload.
  return {
    username: user.username || cleanUsername,
    realName: user.profile?.realName,
    avatarUrl: user.profile?.userAvatar,
    ranking: user.profile?.ranking,
    totalSolved: solved.get('All') ?? 0,
    easySolved: solved.get('Easy') ?? 0,
    mediumSolved: solved.get('Medium') ?? 0,
    hardSolved: solved.get('Hard') ?? 0,
    history,
  }
}
