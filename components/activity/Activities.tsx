"use client";

import { useCallback, useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Plus, Code2, RefreshCcw, X } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api/fetch";
import {type Activity, type Profile, type ActivityOption} from "@/types";
import {
  ActivitiesResponseSchema,
  ActivityCreateResponseSchema,
  PlatformSyncResponseSchema,
  type PlatformSyncResponse,
  ProfileResponseSchema,
} from "@/types/api";

import { ActivityCard } from "./ActivityCard";
import { GithubIcon } from "../icons/GithubIcon";

// type ActivityType = 'github' | 'leetcode' | 'gym' | 'jogging' | 'study' | 'project'

// type Activity = {
//   id: string
//   type: ActivityType
//   title: string
//   date: string
//   points: number
//   details?: string
// }

// type Profile = {
//   githubUsername: string
//   leetcodeUsername: string
//   githubContributions: number
//   githubPublicRepos: number
//   githubFollowers: number
//   leetcodeSolved: number
//   lastPlatformSyncAt: string | null
// }

// type ActivityOption = {
//   label: string
//   type: ActivityType
//   defaultValue: number
//   unit: string
// }

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

// The activities page is the user's control panel for manual logs and platform sync.
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
  const [initialLoading, setInitialLoading] = useState(true);

  // Manual logs and live profile data are loaded together so the page always reflects the latest state.
  const loadActivities = useCallback(async () => {
    try {
      const data = await apiFetch('/api/activities?limit=50', ActivitiesResponseSchema);
      setActivities(data.activities);
    } catch {
      // silently keep stale state
    }
  }, []);

  // The profile snapshot tells the page whether GitHub or LeetCode can be synced automatically.
  const loadProfile = useCallback(async () => {
    try {
      const data = await apiFetch('/api/profile', ProfileResponseSchema);
      setProfile({
        githubUsername: data.profile.githubUsername || '',
        leetcodeUsername: data.profile.leetcodeUsername || '',
        githubContributions: data.profile.githubContributions || 0,
        githubPublicRepos: data.profile.githubPublicRepos || 0,
        githubFollowers: data.profile.githubFollowers || 0,
        leetcodeSolved: data.profile.leetcodeSolved || 0,
        lastPlatformSyncAt: data.profile.lastPlatformSyncAt || null,
      });
    } catch {
      // silently keep stale state
    }
  }, []);

  // Keep fetching logic in one place so manual refreshes and auto-sync updates use the same data shape.
  const loadPageData = useCallback(async () => {
    await Promise.all([loadActivities(), loadProfile()]);
  }, [loadActivities, loadProfile]);

  // The first load is separate so the page can show a stable skeleton before any requests resolve.
  const loadInitialPageData = useCallback(async () => {
    setInitialLoading(true);
    try {
      await loadPageData();
    } finally {
      setInitialLoading(false);
    }
  }, [loadPageData]);

  // Sync only runs when at least one platform is connected, otherwise the request would have nothing to do.
  const hasConnectedPlatform = Boolean(profile.githubUsername || profile.leetcodeUsername);

  // Auto-sync quietly refreshes connected platform data on a timer without requiring a manual click.
  const autoSyncQuery = useQuery<PlatformSyncResponse>({
    queryKey: ["platform-sync-auto", profile.githubUsername, profile.leetcodeUsername],
    queryFn: () =>
      apiFetch('/api/platform/sync', PlatformSyncResponseSchema, { method: 'POST' }),
    enabled: hasConnectedPlatform,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    // A successful platform sync should refresh the screen and emit the shared activity event.
    if (!autoSyncQuery.data) {return;}
    window.dispatchEvent(new Event('activity:logged'));
    void loadPageData();
  }, [autoSyncQuery.data, loadPageData]);

  useEffect(() => {
    // Defer the first load by one tick so the browser paints the skeleton first.
    const id = window.setTimeout(() => {
      void loadInitialPageData();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadInitialPageData]);

  // Picking an option updates the form defaults so the value and unit stay aligned.
  function chooseOption(option: ActivityOption) {
    setSelectedOption(option);
    setValue(String(option.defaultValue));
    setCustomTitle('');
  }

  // The manual activity form converts a small user input into a durable logged event.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericValue = Number(value);
    if (!selectedOption || !Number.isFinite(numericValue) || numericValue <= 0) {return;}

    setLoading(true);
  // The sync button gives the user an explicit way to pull fresh GitHub and LeetCode data on demand.
    setStatus('');
    try {
      const data = await apiFetch('/api/activities', ActivityCreateResponseSchema, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: selectedOption.type,
          title: customTitle.trim() || selectedOption.label,
          value: numericValue,
          details: details.trim() || `${numericValue} ${selectedOption.unit}`,
        }),
      });

      setDetails('');
      setCustomTitle('');
      setValue(String(selectedOption.defaultValue));
      setShowAddForm(false);
      setStatus(`Activity logged for ${data.pointsAwarded} points`);
      window.dispatchEvent(new Event('activity:logged'));
      await loadPageData();
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
      const data = await apiFetch('/api/platform/sync', PlatformSyncResponseSchema, {
        method: 'POST',
      });
      // Sync route returns ok=false when both providers fail; surface that as an error message.
      if (!data.ok) {
        throw new Error(data.errors.join(', ') || 'Could not sync platforms');
      }
      const details = data.results.length > 0
        ? data.results.map((result) => result.message).join(' | ')
        : 'Synced latest platform data';
      setStatus(data.pointsAwarded > 0 ? `${details}. Awarded ${data.pointsAwarded} points.` : details);
      window.dispatchEvent(new Event('activity:logged'));
      await loadPageData();
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Could not sync platforms';
      setStatus(message);
    } finally {
      setSyncing(false);
    }
  }

  const githubConnected = Boolean(profile.githubUsername);
  const leetcodeConnected = Boolean(profile.leetcodeUsername);

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-50 w-full rounded-xl" />
        <Skeleton className="h-100 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
      {/* The header gives a fast summary and a single obvious entry point for adding new work. */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Activities</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track your daily progress</p>
          {status && <p className="text-xs sm:text-sm text-muted-foreground mt-2">{status}</p>}
        </div>
        <button
          id="tour-activities-add"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span className="hidden sm:inline">{showAddForm ? "Cancel" : "Add Activity"}</span>
          <span className="sm:hidden">{showAddForm ? "Close" : "Add"}</span>
        </button>
      </div>

      {/* The add form stays collapsed until the user chooses to log something new. */}
      {showAddForm && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Log Activity</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground/80 mb-2">Select Activity</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activityOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => chooseOption(option)}
                    className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-sm transition-colors ${selectedOption.label === option.label
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-border hover:border-muted-foreground/50 text-foreground/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs sm:text-sm font-medium text-foreground/80 mb-2">Title</span>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  placeholder={selectedOption.label}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
              <label className="block">
                <span className="block text-xs sm:text-sm font-medium text-foreground/80 mb-2">Value</span>
                <div className="flex">
                  <input
                    type="number"
                    min="1"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-l-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <span className="px-2 sm:px-3 py-2 border border-l-0 border-border rounded-r-lg bg-muted text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{selectedOption.unit}</span>
                </div>
              </label>
            </div>

            <label className="block">
              <span className="block text-xs sm:text-sm font-medium text-foreground/80 mb-2">Details</span>
              <input
                type="text"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Optional details"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging...' : 'Log Activity'}
            </button>
          </form>
        </div>
      )}

      {/* Connected platforms are grouped here because they explain where automated points come from. */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Connected Platforms</h2>
          <button
            onClick={syncPlatforms}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-border text-foreground/80 text-sm rounded-lg hover:bg-muted disabled:opacity-50 w-full sm:w-auto"
          >
            <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <GithubIcon className="w-5 sm:w-6 h-5 sm:h-6 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-medium text-foreground">GitHub</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{githubConnected ? `${profile.githubUsername}` : 'Add username in Profile'}</p>
              </div>
            </div>
            <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap shrink-0 ${githubConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
              {githubConnected ? 'Connected' : 'Not set'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Code2 className="w-5 sm:w-6 h-5 sm:h-6 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-medium text-foreground">LeetCode</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{leetcodeConnected ? `${profile.leetcodeUsername}` : 'Add username in Profile'}</p>
              </div>
            </div>
            <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap shrink-0 ${leetcodeConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
              {leetcodeConnected ? 'Connected' : 'Not set'}
            </span>
          </div>
        </div>
        {profile.lastPlatformSyncAt && <p className="text-[11px] sm:text-xs text-muted-foreground mt-3">Last synced {new Date(profile.lastPlatformSyncAt).toLocaleString()}</p>}
      </div>

      {/* The history list closes the loop by showing everything the user has already logged. */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Activity History</h2>
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
          {activities.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No activity logged yet. Add an activity or sync a connected platform.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
