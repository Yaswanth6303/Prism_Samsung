import { TrendingUp, Flame, Trophy, Code2, Dumbbell, Footprints, BrainCircuit, ArrowRight } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";
import Link from "next/link";
import { currentUserStats, recentActivities } from "./data/mockData";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { StreakDisplay } from "./StreakDisplay";
import { ActivityCard } from "./ActivityCard";

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* ClawMind Feature Card */}
      <Link href="/study" className="block mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">ClawMind</h2>
                <p className="text-indigo-100 text-sm">AI-powered study assistant with Notes, Quizzes and Whiteboard</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
      </Link>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Points</p>
              <p className="text-2xl font-semibold text-gray-900">{currentUserStats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-2xl font-semibold text-gray-900">{currentUserStats.currentStreak}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">College Rank</p>
              <p className="text-2xl font-semibold text-gray-900">#{currentUserStats.rank}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Flame className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Best Streak</p>
              <p className="text-2xl font-semibold text-gray-900">{currentUserStats.longestStreak}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <GithubIcon className="w-4 h-4 text-gray-700" />
            <span className="text-sm text-gray-600">GitHub</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">{currentUserStats.githubContributions}</p>
          <p className="text-xs text-gray-500">contributions</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-4 h-4 text-gray-700" />
            <span className="text-sm text-gray-600">LeetCode</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">{currentUserStats.leetcodeSolved}</p>
          <p className="text-xs text-gray-500">problems solved</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-4 h-4 text-gray-700" />
            <span className="text-sm text-gray-600">Gym</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">{currentUserStats.gymSessions}</p>
          <p className="text-xs text-gray-500">sessions</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Footprints className="w-4 h-4 text-gray-700" />
            <span className="text-sm text-gray-600">Jogging</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">{currentUserStats.joggingDistance}km</p>
          <p className="text-xs text-gray-500">distance</p>
        </div>
      </div>

      {/* Streak Display */}
      <StreakDisplay />

      {/* Activity Heatmap */}
      <ActivityHeatmap />

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-3">
          {recentActivities.slice(0, 5).map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
}
