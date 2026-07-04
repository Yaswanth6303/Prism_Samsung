import { z } from "zod";

import { OkLiteral } from "./_shared";

export const ActivityTypeSchema = z.enum([
  "github",
  "leetcode",
  "gym",
  "jogging",
  "study",
  "project",
]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const ActivityItemSchema = z.object({
  id: z.string(),
  type: ActivityTypeSchema,
  title: z.string(),
  date: z.string(),
  points: z.number(),
  details: z.string(),
});
export type ActivityItem = z.infer<typeof ActivityItemSchema>;

export const ActivitiesResponseSchema = z.object({
  ok: OkLiteral,
  activities: z.array(ActivityItemSchema),
});
export type ActivitiesResponse = z.infer<typeof ActivitiesResponseSchema>;

export const ActivityCreateBodySchema = z.object({
  type: ActivityTypeSchema,
  title: z.string().min(1),
  value: z.number().positive(),
  details: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type ActivityCreateBody = z.infer<typeof ActivityCreateBodySchema>;

export const ActivityCreateResponseSchema = z.object({
  ok: OkLiteral,
  // The server returns the freshly-inserted document, which carries Mongo internals we don't constrain.
  activity: z.unknown(),
  pointsAwarded: z.number(),
});
export type ActivityCreateResponse = z.infer<typeof ActivityCreateResponseSchema>;

// Heatmap: per-day counts plus optional activity titles for the tooltip.
export const HeatmapPointSchema = z.object({
  date: z.string(),
  count: z.number(),
  activities: z.array(z.string()),
});
export type HeatmapPoint = z.infer<typeof HeatmapPointSchema>;

export const HeatmapResponseSchema = z.object({
  ok: OkLiteral,
  year: z.number(),
  data: z.array(HeatmapPointSchema),
});
export type HeatmapResponse = z.infer<typeof HeatmapResponseSchema>;

// Stats: dashboard aggregate snapshot. Most fields default to 0 server-side when missing.
export const StatsSchema = z.object({
  userId: z.string(),
  totalPoints: z.number().optional(),
  currentStreak: z.number().optional(),
  longestStreak: z.number().optional(),
  rank: z.number(),
  githubUsername: z.string().optional(),
  leetcodeUsername: z.string().optional(),
  githubContributions: z.number().optional(),
  githubPublicRepos: z.number(),
  githubFollowers: z.number(),
  leetcodeSolved: z.number().optional(),
  leetcodeEasySolved: z.number(),
  leetcodeMediumSolved: z.number(),
  leetcodeHardSolved: z.number(),
  gymSessions: z.number().optional(),
  joggingDistance: z.number().optional(),
  activityCount: z.number(),
  dailyLogCount: z.number(),
});
export type Stats = z.infer<typeof StatsSchema>;

export const StatsResponseSchema = z.object({
  ok: OkLiteral,
  stats: StatsSchema,
});
export type StatsResponse = z.infer<typeof StatsResponseSchema>;

// Legacy in-memory feed entries — shape is loose because the feature-store is being phased out.
export const FeedEntrySchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    platform: z.string(),
    type: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    pointsAwarded: z.number().optional(),
    createdAt: z.string(),
  })
  .passthrough();
export type FeedEntry = z.infer<typeof FeedEntrySchema>;

export const FeedResponseSchema = z.object({
  ok: OkLiteral,
  feed: z.array(FeedEntrySchema),
});
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
