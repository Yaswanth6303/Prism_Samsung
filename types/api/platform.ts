import { z } from "zod";

import { OkLiteral } from "./_shared";

export const PlatformProviderSchema = z.enum(["github", "leetcode"]);
export type PlatformProvider = z.infer<typeof PlatformProviderSchema>;

export const GitHubSnapshotSchema = z.object({
  username: z.string(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
  profileUrl: z.string().optional(),
  publicRepos: z.number(),
  followers: z.number(),
  recentContributions: z.number(),
  history: z.record(z.string(), z.number()),
});
export type GitHubSnapshot = z.infer<typeof GitHubSnapshotSchema>;

export const LeetCodeSnapshotSchema = z.object({
  username: z.string(),
  realName: z.string().optional(),
  avatarUrl: z.string().optional(),
  ranking: z.number().optional(),
  totalSolved: z.number(),
  easySolved: z.number(),
  mediumSolved: z.number(),
  hardSolved: z.number(),
  history: z.record(z.string(), z.number()),
});
export type LeetCodeSnapshot = z.infer<typeof LeetCodeSnapshotSchema>;

export const PlatformSnapshotPayloadSchema = z.object({
  github: GitHubSnapshotSchema.optional(),
  leetcode: LeetCodeSnapshotSchema.optional(),
});
export type PlatformSnapshotPayload = z.infer<typeof PlatformSnapshotPayloadSchema>;

export const PlatformSyncResultSchema = z.object({
  provider: PlatformProviderSchema,
  ok: z.boolean(),
  message: z.string(),
});
export type PlatformSyncResult = z.infer<typeof PlatformSyncResultSchema>;

// The sync endpoint reports per-provider success even when overall ok=false (e.g., one platform unreachable).
export const PlatformSyncResponseSchema = z.object({
  ok: z.boolean(),
  snapshot: PlatformSnapshotPayloadSchema,
  pointsAwarded: z.number(),
  results: z.array(PlatformSyncResultSchema),
  errors: z.array(z.string()),
});
export type PlatformSyncResponse = z.infer<typeof PlatformSyncResponseSchema>;
