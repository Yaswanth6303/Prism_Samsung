import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  githubContributions: number;
  leetcodeSolved: number;
  gymSessions: number;
  joggingDistance: number;
  githubUsername?: string;
  leetcodeUsername?: string;
  avatarUrl?: string;
  githubPublicRepos: number;
  githubFollowers: number;
  leetcodeEasySolved: number;
  leetcodeMediumSolved: number;
  leetcodeHardSolved: number;
  lastPlatformSyncAt?: Date;
  openaiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
  githubPat?: string;
  leetcodePat?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    githubContributions: { type: Number, default: 0 },
    leetcodeSolved: { type: Number, default: 0 },
    gymSessions: { type: Number, default: 0 },
    joggingDistance: { type: Number, default: 0 },
    githubUsername: { type: String },
    leetcodeUsername: { type: String },
    avatarUrl: { type: String },
    githubPublicRepos: { type: Number, default: 0 },
    githubFollowers: { type: Number, default: 0 },
    leetcodeEasySolved: { type: Number, default: 0 },
    leetcodeMediumSolved: { type: Number, default: 0 },
    leetcodeHardSolved: { type: Number, default: 0 },
    lastPlatformSyncAt: { type: Date },
    openaiKey: { type: String },
    anthropicKey: { type: String },
    geminiKey: { type: String },
    githubPat: { type: String },
    leetcodePat: { type: String },
    emailVerified: { type: Boolean, default: false },
    image: { type: String },
  },
  { timestamps: true, collection: 'user' }
);

// Index for leaderboard queries: sort by totalPoints (desc), then createdAt (asc)
UserSchema.index({ totalPoints: -1, createdAt: 1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
