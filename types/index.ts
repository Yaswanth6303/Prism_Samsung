export * from "./auth";

export interface Activity {
  id: string;
  type: "github" | "leetcode" | "gym" | "jogging" | "study" | "project";
  title: string;
  date: string;
  points: number;
  details?: string;
}

export interface Note {
  id: string;
  title: string;
  content?: string;
  createdDate: string;
  hasQuiz: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  notesCount: number;
  notes: Note[];
}

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

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  streak: number;
  department: string;
}
