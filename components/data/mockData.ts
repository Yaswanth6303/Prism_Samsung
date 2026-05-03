// Mock data for the productivity tracker

import type { Activity, Note, Subject, UserStats, LeaderboardEntry } from "@/types";

// Common extracurricular categories
export const extracurricularCategories = [
  "Gym",
  "Jogging",
  "Swimming",
  "Yoga",
  "Reading",
  "Music Practice",
  "Art/Drawing",
  "Volunteer Work",
];

// Study subjects and notes

export const subjects: Subject[] = [
  {
    id: "1",
    name: "Data Structures",
    color: "bg-blue-500",
    notesCount: 3,
    notes: [
      {
        id: "1",
        title: "Binary Trees",
        content: "Key concepts and traversal algorithms",
        createdDate: "2 days ago",
        hasQuiz: true,
      },
      {
        id: "2",
        title: "Hash Tables",
        content: "Collision resolution and performance",
        createdDate: "5 days ago",
        hasQuiz: true,
      },
      {
        id: "3",
        title: "Graphs",
        content: "BFS, DFS, and shortest path algorithms",
        createdDate: "1 week ago",
        hasQuiz: false,
      },
    ],
  },
  {
    id: "2",
    name: "Operating Systems",
    color: "bg-green-500",
    notesCount: 2,
    notes: [
      {
        id: "1",
        title: "Process Scheduling",
        content: "FCFS, SJF, Round Robin algorithms",
        createdDate: "3 days ago",
        hasQuiz: true,
      },
      {
        id: "2",
        title: "Memory Management",
        content: "Paging and segmentation",
        createdDate: "1 week ago",
        hasQuiz: false,
      },
    ],
  },
  {
    id: "3",
    name: "DBMS",
    color: "bg-purple-500",
    notesCount: 1,
    notes: [
      {
        id: "1",
        title: "Normalization",
        content: "1NF, 2NF, 3NF, BCNF explained",
        createdDate: "4 days ago",
        hasQuiz: true,
      },
    ],
  },
];

// Current user stats
export const currentUserStats: UserStats = {
  totalPoints: 2450,
  currentStreak: 12,
  longestStreak: 23,
  rank: 3,
  githubContributions: 156,
  leetcodeSolved: 89,
  gymSessions: 24,
  joggingDistance: 45.5,
};

// Recent activities
export const recentActivities: Activity[] = [
  {
    id: "1",
    type: "github",
    title: "Merged PR: Add authentication",
    date: "2026-04-30",
    points: 50,
    details: "3 commits, 245 additions",
  },
  {
    id: "2",
    type: "leetcode",
    title: "Solved: Two Sum",
    date: "2026-04-30",
    points: 30,
    details: "Easy difficulty",
  },
  {
    id: "3",
    type: "gym",
    title: "Gym Session",
    date: "2026-04-30",
    points: 20,
    details: "1.5 hours",
  },
  {
    id: "4",
    type: "jogging",
    title: "Morning Run",
    date: "2026-04-29",
    points: 25,
    details: "5km in 28 mins",
  },
  {
    id: "5",
    type: "github",
    title: "Pushed 5 commits",
    date: "2026-04-29",
    points: 25,
    details: "Feature development",
  },
  {
    id: "6",
    type: "leetcode",
    title: "Solved: Binary Tree Level Order",
    date: "2026-04-28",
    points: 40,
    details: "Medium difficulty",
  },
  {
    id: "7",
    type: "gym",
    title: "Gym Session",
    date: "2026-04-28",
    points: 20,
    details: "1 hour",
  },
  {
    id: "8",
    type: "project",
    title: "Completed Database Design",
    date: "2026-04-27",
    points: 60,
    details: "Personal project milestone",
  },
];

// Leaderboard data
export const leaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "Arjun Kumar",
    avatar: "AK",
    points: 3240,
    streak: 28,
    department: "Computer Science",
  },
  {
    rank: 2,
    name: "Priya Sharma",
    avatar: "PS",
    points: 2890,
    streak: 21,
    department: "Information Technology",
  },
  {
    rank: 3,
    name: "You",
    avatar: "ME",
    points: 2450,
    streak: 12,
    department: "Computer Science",
  },
  {
    rank: 4,
    name: "Rahul Verma",
    avatar: "RV",
    points: 2310,
    streak: 15,
    department: "Electronics",
  },
  {
    rank: 5,
    name: "Sneha Patel",
    avatar: "SP",
    points: 2180,
    streak: 9,
    department: "Computer Science",
  },
  {
    rank: 6,
    name: "Vikram Singh",
    avatar: "VS",
    points: 1950,
    streak: 18,
    department: "Mechanical",
  },
  {
    rank: 7,
    name: "Ananya Reddy",
    avatar: "AR",
    points: 1820,
    streak: 7,
    department: "Information Technology",
  },
  {
    rank: 8,
    name: "Karthik Nair",
    avatar: "KN",
    points: 1690,
    streak: 14,
    department: "Computer Science",
  },
];

// Heatmap data - last 12 months
export const generateHeatmapData = () => {
  const data: { date: string; count: number }[] = [];
  const today = new Date("2026-04-30");

  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Generate random activity count with some patterns
    const dayOfWeek = date.getDay();
    let count = 0;

    // Less activity on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      count = Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0;
    } else {
      count = Math.floor(Math.random() * 8);
    }

    data.push({ date: dateStr, count });
  }

  return data;
};

export const heatmapData = generateHeatmapData();
