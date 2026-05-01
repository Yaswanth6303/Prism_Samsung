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
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
