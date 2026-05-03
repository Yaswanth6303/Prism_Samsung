"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Code2, RefreshCcw, X } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";
import { ActivityCard } from "./ActivityCard";

type ActivityType = 'github' | 'leetcode' | 'gym' | 'jogging' | 'study' | 'project'

type Activity = {
  id: string
  type: ActivityType
  title: string
  date: string
  points: number
  details?: string
}

type Profile = {
  githubUsername: string
  leetcodeUsername: string
  githubContributions: number
  githubPublicRepos: number
  githubFollowers: number
  leetcodeSolved: number
  lastPlatformSyncAt: string | null
}

type ActivityOption = {
  label: string
  type: ActivityType
  defaultValue: number
  unit: string
}

const activityOptions: ActivityOption[] = [
  { label: 'Gym Session', type: 'gym', defaultValue: 1, unit: 'session' },
  { label: 'Jogging', type: 'jogging', defaultValue: 3, unit: 'km' },
  { label: 'Study Session', type: 'study', defaultValue: 30, unit: 'points' },
  { label: 'Project Work', type: 'project', defaultValue: 50, unit: 'points' },
]

const emptyProfile: Profile = {
  githubUsername: '',
  leetcodeUsername: '',
  githubContributions: 0,
  githubPublicRepos: 0,
  githubFollowers: 0,
  leetcodeSolved: 0,
  lastPlatformSyncAt: null,
}

export function Activities() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [selectedOption, setSelectedOption] = useState<ActivityOption>(activityOptions[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [value, setValue] = useState(String(activityOptions[0].defaultValue));
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadActivities = useCallback(async () => {
    const response = await fetch('/api/activities?limit=50');
    if (!response.ok) return;
    const json = await response.json();
    if (json?.ok && Array.isArray(json.activities)) {
      setActivities(json.activities);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const response = await fetch('/api/profile');
    if (!response.ok) return;
    const json = await response.json();
    if (json?.ok && json.profile) {
      setProfile({
        githubUsername: json.profile.githubUsername || '',
        leetcodeUsername: json.profile.leetcodeUsername || '',
        githubContributions: json.profile.githubContributions || 0,
        githubPublicRepos: json.profile.githubPublicRepos || 0,
        githubFollowers: json.profile.githubFollowers || 0,
        leetcodeSolved: json.profile.leetcodeSolved || 0,
        lastPlatformSyncAt: json.profile.lastPlatformSyncAt || null,
      });
    }
  }, []);

  const refreshPageData = useCallback(async () => {
    await Promise.all([loadActivities(), loadProfile()]);
  }, [loadActivities, loadProfile]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshPageData();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refreshPageData]);

  // If the user has never synced platforms before, run a one-time sync when
  // Activities loads and we have platform usernames available. The server will
  // set `lastPlatformSyncAt` so this only runs once per user.
  useEffect(() => {
    if (profile.lastPlatformSyncAt !== null) return;
    if (!profile.githubUsername && !profile.leetcodeUsername) return;

    // Fire-and-forget the initial sync; UI state will update when it completes
    void (async () => {
      try {
        setSyncing(true);
        const response = await fetch('/api/platform/sync', { method: 'POST' });
        const json = await response.json();
        if (response.ok && json?.ok) {
          window.dispatchEvent(new Event('activity:logged'));
          await refreshPageData();
        }
      } catch (e) {
        // ignore failures for initial sync; user can press Sync manually
      } finally {
        setSyncing(false);
      }
    })();
  }, [profile.lastPlatformSyncAt, profile.githubUsername, profile.leetcodeUsername, refreshPageData]);

  function chooseOption(option: ActivityOption) {
    setSelectedOption(option);
    setValue(String(option.defaultValue));
    setCustomTitle('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericValue = Number(value);
    if (!selectedOption || !Number.isFinite(numericValue) || numericValue <= 0) return;

    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: selectedOption.type,
          title: customTitle.trim() || selectedOption.label,
          value: numericValue,
          details: details.trim() || `${numericValue} ${selectedOption.unit}`,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Could not log activity');

      setDetails('');
      setCustomTitle('');
      setValue(String(selectedOption.defaultValue));
      setShowAddForm(false);
      setStatus(`Activity logged for ${json.pointsAwarded} points`);
      window.dispatchEvent(new Event('activity:logged'));
      await refreshPageData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not log activity');
    } finally {
      setLoading(false);
    }
  };

  async function syncPlatforms() {
    setSyncing(true);
    setStatus('');
    try {
      const response = await fetch('/api/platform/sync', { method: 'POST' });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error || json?.errors?.join(', ') || 'Could not sync platforms');
      const details = Array.isArray(json.results) ? json.results.map((result: { message: string }) => result.message).join(' | ') : 'Synced latest platform data';
      setStatus(json.pointsAwarded > 0 ? `${details}. Awarded ${json.pointsAwarded} points.` : details);
      window.dispatchEvent(new Event('activity:logged'));
      await refreshPageData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not sync platforms');
    } finally {
      setSyncing(false);
    }
  }

  const githubConnected = Boolean(profile.githubUsername);
  const leetcodeConnected = Boolean(profile.leetcodeUsername);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>
          <p className="text-sm text-gray-500 mt-1">Track your daily progress</p>
          {status && <p className="text-sm text-gray-600 mt-2">{status}</p>}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span className="hidden sm:inline">{showAddForm ? "Cancel" : "Add Activity"}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Activity</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Activity</label>
              <div className="grid grid-cols-2 gap-2">
                {activityOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => chooseOption(option)}
                    className={`p-3 rounded-lg border-2 text-sm transition-colors ${selectedOption.label === option.label
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">Title</span>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder={selectedOption.label}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">Value</span>
                <div className="flex">
                  <input
                    type="number"
                    min="1"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-sm text-gray-500">{selectedOption.unit}</span>
                </div>
              </label>
            </div>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-2">Details</span>
              <input
                type="text"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Optional details"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging...' : 'Log Activity'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Connected Platforms</h2>
          <button
            onClick={syncPlatforms}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <GithubIcon className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="font-medium text-gray-900">GitHub</p>
                <p className="text-sm text-gray-500">{githubConnected ? `${profile.githubUsername} - ${profile.githubPublicRepos} repos, ${profile.githubFollowers} followers, ${profile.githubContributions} recent public contributions` : 'Add username in Profile'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${githubConnected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {githubConnected ? 'Connected' : 'Not set'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Code2 className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="font-medium text-gray-900">LeetCode</p>
                <p className="text-sm text-gray-500">{leetcodeConnected ? `${profile.leetcodeUsername} - ${profile.leetcodeSolved} solved` : 'Add username in Profile'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${leetcodeConnected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {leetcodeConnected ? 'Connected' : 'Not set'}
            </span>
          </div>
        </div>
        {profile.lastPlatformSyncAt && <p className="text-xs text-gray-400 mt-3">Last synced {new Date(profile.lastPlatformSyncAt).toLocaleString()}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h2>
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
          {activities.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No activity logged yet. Add an activity or sync a connected platform.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
