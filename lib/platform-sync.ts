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
}

export type PlatformSnapshot = {
  github?: {
    username: string
    name?: string
    avatarUrl?: string
    profileUrl?: string
    publicRepos: number
    followers: number
    recentContributions: number
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
  }
}

function assertOk(response: Response, service: string) {
  if (!response.ok) {
    throw new Error(`${service} returned ${response.status}`)
  }
}

export async function fetchGitHubSnapshot(username: string) {
  const cleanUsername = username.trim()
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const [userResponse, eventsResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, { headers, cache: 'no-store' }),
    fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/events/public?per_page=100`, { headers, cache: 'no-store' }),
  ])

  assertOk(userResponse, 'GitHub profile')
  const user = await userResponse.json() as GitHubUserResponse

  let recentContributions = 0
  if (eventsResponse.ok) {
    const events = await eventsResponse.json() as GitHubEvent[]
    recentContributions = events.reduce((total, event) => {
      if (event.type === 'PushEvent') return total + (event.payload?.commits?.length || 1)
      if (event.type === 'PullRequestEvent' && ['opened', 'closed', 'reopened'].includes(event.payload?.action || '')) return total + 1
      if (event.type === 'IssuesEvent' && event.payload?.action === 'opened') return total + 1
      return total
    }, 0)
  }

  return {
    username: user.login || cleanUsername,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    publicRepos: user.public_repos ?? 0,
    followers: user.followers ?? 0,
    recentContributions,
  }
}

export async function fetchLeetCodeSnapshot(username: string) {
  const cleanUsername = username.trim()
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      referer: 'https://leetcode.com',
      'user-agent': 'Mozilla/5.0 PrismSamsung/1.0',
    },
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

  const solved = new Map((user.submitStatsGlobal?.acSubmissionNum ?? []).map((item) => [item.difficulty, item.count]))

  return {
    username: user.username || cleanUsername,
    realName: user.profile?.realName,
    avatarUrl: user.profile?.userAvatar,
    ranking: user.profile?.ranking,
    totalSolved: solved.get('All') ?? 0,
    easySolved: solved.get('Easy') ?? 0,
    mediumSolved: solved.get('Medium') ?? 0,
    hardSolved: solved.get('Hard') ?? 0,
  }
}
