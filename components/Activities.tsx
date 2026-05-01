"use client";

import { useState } from "react";
import { Plus, Code2, X } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";
import { recentActivities, extracurricularCategories } from "./data/mockData";
import { ActivityCard } from "./ActivityCard";

export function Activities() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState(extracurricularCategories);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  const [isOther, setIsOther] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If "Other" was selected and custom activity was entered, add it to the list
    if (isOther && customActivity.trim()) {
      setCategories([...categories, customActivity.trim()]);
    }

    // Reset form
    setSelectedCategory('');
    setCustomActivity('');
    setIsOther(false);
    setShowAddForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>
          <p className="text-sm text-gray-500 mt-1">Track your daily progress</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span className="hidden sm:inline">{showAddForm ? 'Cancel' : 'Add Activity'}</span>
        </button>
      </div>

      {/* Add Activity Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Extracurricular Activity</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Activity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsOther(false);
                    }}
                    className={`p-3 rounded-lg border-2 text-sm transition-colors ${selectedCategory === category && !isOther
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                  >
                    {category}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsOther(true);
                    setSelectedCategory('');
                  }}
                  className={`p-3 rounded-lg border-2 text-sm transition-colors ${isOther
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                >
                  Other
                </button>
              </div>
            </div>

            {isOther && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Name
                </label>
                <input
                  type="text"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  placeholder="e.g., Badminton, Dance, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedCategory && !customActivity.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Log Activity
            </button>
          </form>
        </div>
      )}

      {/* Connected Platforms */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Platforms</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <GithubIcon className="w-6 h-6 text-gray-700" />
              <div>
                <p className="font-medium text-gray-900">GitHub</p>
                <p className="text-sm text-gray-500">Auto-sync contributions</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Code2 className="w-6 h-6 text-gray-700" />
              <div>
                <p className="font-medium text-gray-900">LeetCode</p>
                <p className="text-sm text-gray-500">Auto-sync solved problems</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h2>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
}
