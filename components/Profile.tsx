"use client"

import { useEffect, useState } from "react";
import { RefreshCcw, Save, Settings } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";

type ProfileData = {
  name: string
  email: string
  avatarUrl: string
  githubUsername: string
  leetcodeUsername: string
  totalPoints: number
  currentStreak: number
  longestStreak: number
  rank: number
  githubContributions: number
  githubPublicRepos: number
  githubFollowers: number
  leetcodeSolved: number
  leetcodeEasySolved: number
  leetcodeMediumSolved: number
  leetcodeHardSolved: number
  gymSessions: number
  joggingDistance: number
  lastPlatformSyncAt: string | null
}

const emptyProfile: ProfileData = {
  name: '',
  email: '',
  avatarUrl: '',
  githubUsername: '',
  leetcodeUsername: '',
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  rank: 0,
  githubContributions: 0,
  githubPublicRepos: 0,
  githubFollowers: 0,
  leetcodeSolved: 0,
  leetcodeEasySolved: 0,
  leetcodeMediumSolved: 0,
  leetcodeHardSolved: 0,
  gymSessions: 0,
  joggingDistance: 0,
  lastPlatformSyncAt: null,
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'ME'
}

export function Profile() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile)
  const [form, setForm] = useState({ name: '', githubUsername: '', leetcodeUsername: '' })
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  async function loadProfile() {
    const response = await fetch('/api/profile')
    if (!response.ok) return
    const json = await response.json()
    if (json?.ok && json.profile) {
      setProfile(json.profile)
      setForm({
        name: json.profile.name || '',
        githubUsername: json.profile.githubUsername || '',
        leetcodeUsername: json.profile.leetcodeUsername || '',
      })
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadProfile()
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  async function saveProfile(options: { silent?: boolean } = {}) {
    setSaving(true)
    if (!options.silent) setStatus('')
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Could not save profile')
      setProfile(json.profile)
      if (!options.silent) setStatus('Profile saved')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save profile'
      setStatus(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function syncPlatforms() {
    setSyncing(true)
    setStatus('')
    try {
      const saved = await saveProfile({ silent: true })
      if (!saved) return
      const response = await fetch('/api/platform/sync', { method: 'POST' })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || json?.errors?.join(', ') || 'Could not sync platforms')
      await loadProfile()
      const details = Array.isArray(json.results) ? json.results.map((result: { message: string }) => result.message).join(' | ') : 'Synced latest public data'
      setStatus(json.pointsAwarded > 0 ? `${details}. Awarded ${json.pointsAwarded} points.` : details)
      window.dispatchEvent(new Event('activity:logged'))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not sync platforms')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-semibold text-white overflow-hidden">
            {profile.avatarUrl ? (
              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${profile.avatarUrl})` }} />
            ) : initials(profile.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{profile.name || 'Your Profile'}</h1>
            <p className="text-gray-500">{profile.email || 'Signed-in student'}</p>
            {profile.lastPlatformSyncAt && (
              <p className="text-xs text-gray-400 mt-1">Last synced {new Date(profile.lastPlatformSyncAt).toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={syncPlatforms}
            disabled={syncing || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Points</p>
            <p className="text-xl font-semibold text-gray-900">{profile.totalPoints}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Rank</p>
            <p className="text-xl font-semibold text-gray-900">#{profile.rank || 1}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">GitHub Repos</p>
            <p className="text-xl font-semibold text-gray-900">{profile.githubPublicRepos}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">LeetCode</p>
            <p className="text-xl font-semibold text-gray-900">{profile.leetcodeSolved}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-gray-600">Display name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">GitHub username</span>
            <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
              <GithubIcon className="w-4 h-4 text-gray-500" />
              <input
                value={form.githubUsername}
                onChange={(event) => setForm((prev) => ({ ...prev, githubUsername: event.target.value }))}
                className="w-full outline-none"
                placeholder="octocat"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">LeetCode username</span>
            <input
              value={form.leetcodeUsername}
              onChange={(event) => setForm((prev) => ({ ...prev, leetcodeUsername: event.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="leetcode_handle"
            />
          </label>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Followers</p>
              <p className="font-semibold">{profile.githubFollowers}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Easy</p>
              <p className="font-semibold">{profile.leetcodeEasySolved}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Medium</p>
              <p className="font-semibold">{profile.leetcodeMediumSolved}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Hard</p>
              <p className="font-semibold">{profile.leetcodeHardSolved}</p>
            </div>
          </div>
        </div>

        {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}

        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? <Settings className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
      </div>
    </div>
  );
}
