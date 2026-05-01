import { Trophy, Medal, Flame } from "lucide-react";
import { leaderboardData } from "./data/mockData";

export function Leaderboard() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8" />
            <h1 className="text-2xl font-semibold">College Leaderboard</h1>
          </div>
          <p className="text-blue-100">Top performers this month</p>
        </div>

        {/* Top 3 Podium */}
        <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* 2nd Place */}
            <div className="flex flex-col items-center pt-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700">
                  {leaderboardData[1].avatar}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-700">2</span>
                </div>
              </div>
              <p className="mt-2 font-semibold text-gray-900 text-sm text-center">{leaderboardData[1].name}</p>
              <p className="text-xs text-gray-500">{leaderboardData[1].points} pts</p>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-2xl font-semibold text-yellow-900 ring-4 ring-yellow-200">
                  {leaderboardData[0].avatar}
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-900" />
                </div>
              </div>
              <p className="mt-2 font-semibold text-gray-900 text-center">{leaderboardData[0].name}</p>
              <p className="text-sm text-gray-500">{leaderboardData[0].points} pts</p>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center pt-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-orange-200 flex items-center justify-center text-xl font-semibold text-orange-700">
                  {leaderboardData[2].avatar}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-orange-700">3</span>
                </div>
              </div>
              <p className="mt-2 font-semibold text-gray-900 text-sm text-center">{leaderboardData[2].name}</p>
              <p className="text-xs text-gray-500">{leaderboardData[2].points} pts</p>
            </div>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="divide-y divide-gray-200">
          {leaderboardData.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${entry.name === 'You' ? 'bg-blue-50 hover:bg-blue-100' : ''
                }`}
            >
              {/* Rank */}
              <div className="w-10 flex-shrink-0">
                {entry.rank <= 3 ? (
                  <Medal
                    className={`w-6 h-6 ${entry.rank === 1
                        ? 'text-yellow-500'
                        : entry.rank === 2
                          ? 'text-gray-400'
                          : 'text-orange-400'
                      }`}
                  />
                ) : (
                  <span className="text-gray-500 font-medium">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${entry.name === 'You'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                  }`}
              >
                {entry.avatar}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {entry.name}
                  {entry.name === 'You' && (
                    <span className="ml-2 text-xs font-normal text-blue-600">(You)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500 truncate">{entry.department}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">{entry.streak}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{entry.points}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
