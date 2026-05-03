// Quick test to debug platform sync
import { fetchGitHubSnapshot, fetchLeetCodeSnapshot } from './lib/platform-sync'

async function test() {
  console.log('\n=== Testing GitHub Fetch ===')
  try {
    const gh = await fetchGitHubSnapshot('torvalds') // Linus Torvalds as test
    console.log('GitHub result:', {
      username: gh.username,
      repos: gh.publicRepos,
      followers: gh.followers,
      contributions: gh.recentContributions,
      historyDays: Object.keys(gh.history).length,
    })
  } catch (e) {
    console.error('GitHub error:', e instanceof Error ? e.message : e)
  }

  console.log('\n=== Testing LeetCode Fetch ===')
  try {
    const lc = await fetchLeetCodeSnapshot('dqn') // Popular LeetCode user
    console.log('LeetCode result:', {
      username: lc.username,
      totalSolved: lc.totalSolved,
      easySolved: lc.easySolved,
      mediumSolved: lc.mediumSolved,
      hardSolved: lc.hardSolved,
      historyDays: Object.keys(lc.history).length,
    })
  } catch (e) {
    console.error('LeetCode error:', e instanceof Error ? e.message : e)
  }
}

test()
