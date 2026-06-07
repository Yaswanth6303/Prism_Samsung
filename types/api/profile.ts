import { z } from "zod";

import { OkLiteral } from "./_shared";

// Server returns a flat profile shape so the client can render it without transforms.
export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string(),
  githubUsername: z.string(),
  leetcodeUsername: z.string(),
  totalPoints: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  rank: z.number(),
  githubContributions: z.number(),
  githubPublicRepos: z.number(),
  githubFollowers: z.number(),
  leetcodeSolved: z.number(),
  leetcodeEasySolved: z.number(),
  leetcodeMediumSolved: z.number(),
  leetcodeHardSolved: z.number(),
  gymSessions: z.number(),
  joggingDistance: z.number(),
  lastPlatformSyncAt: z.string().nullable(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileResponseSchema = z.object({
  ok: OkLiteral,
  profile: ProfileSchema,
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const ProfileUpdateBodySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  githubUsername: z.string().max(40).optional().or(z.literal("")),
  leetcodeUsername: z.string().max(40).optional().or(z.literal("")),
});
export type ProfileUpdateBody = z.infer<typeof ProfileUpdateBodySchema>;

// Keys endpoints intentionally never return the secret values themselves —
// only presence booleans so the UI can render "Saved" badges.
export const KeysStatusSchema = z.object({
  ok: OkLiteral,
  hasOpenAI: z.boolean(),
  hasAnthropic: z.boolean(),
  hasGemini: z.boolean(),
  hasGithubPat: z.boolean(),
  hasLeetKey: z.boolean(),
});
export type KeysStatusResponse = z.infer<typeof KeysStatusSchema>;

export const KeysUpdateBodySchema = z.object({
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
  geminiKey: z.string().optional(),
  githubPat: z.string().optional(),
  leetcodePat: z.string().optional(),
});
export type KeysUpdateBody = z.infer<typeof KeysUpdateBodySchema>;
