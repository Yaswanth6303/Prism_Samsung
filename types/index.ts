export * from "./auth";

export interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  githubContributions: number;
  leetcodeSolved: number;
  gymSessions: number;
  joggingDistance: number;
}

// Activity
export interface ActivityCardProps {
  activity: Activity;
}

// ActivityCard

export type ActivityType = "github" | "leetcode" | "gym" | "jogging" | "study" | "project";

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  date: string;
  points: number;
  details?: string;
};

export type Profile = {
  githubUsername: string;
  leetcodeUsername: string;
  githubContributions: number;
  githubPublicRepos: number;
  githubFollowers: number;
  leetcodeSolved: number;
  lastPlatformSyncAt: string | null;
};

export type ActivityOption = {
  label: string;
  type: ActivityType;
  defaultValue: number;
  unit: string;
};

// Heatmap

export type HeatmapPoint = { date: string; count: number; activities?: string[] };
export type ActivityCacheEntry = {
  status: "idle" | "loading" | "loaded" | "error";
  activities: string[];
};

// AIStudy

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type Note = {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  createdDate: string;
  hasQuiz: boolean;
  quiz?: QuizQuestion[];
};

export type Subject = {
  id: string;
  name: string;
  color: string;
  notesCount: number;
  notes?: Note[];
};

export type Whiteboard = {
  _id?: string;
  title?: string;
  image: string;
  createdDate?: string;
};

// LeaderBoard
export type LeaderboardEntry = {
  userId?: string;
  rank: number;
  name: string;
  totalPoints: number;
  currentStreak: number;
  department?: string;
  avatar: string;
  isCurrentUser: boolean;
};

// Streaks
export type ActivityEvent = {
  id: string;
  type: "github" | "leetcode" | "gym" | "jogging" | "study" | "project";
  title: string;
  date: string;
  points: number;
  details: string;
};
