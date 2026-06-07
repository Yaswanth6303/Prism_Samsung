import { z } from "zod";

import { OkLiteral } from "./_shared";

export const LeaderboardEntrySchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().optional(),
  totalPoints: z.number(),
  currentStreak: z.number(),
  rank: z.number(),
  isCurrentUser: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const LeaderboardResponseSchema = z.object({
  ok: OkLiteral,
  leaderboard: z.array(LeaderboardEntrySchema),
});
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export const MyRankResponseSchema = z.object({
  ok: OkLiteral,
  userEntry: LeaderboardEntrySchema,
});
export type MyRankResponse = z.infer<typeof MyRankResponseSchema>;

// Connections: raw Mongoose document shape; keeping fields permissive since the schema
// in lib/db/models/Connection.ts accepts arbitrary metadata.
export const ConnectionSchema = z
  .object({
    _id: z.unknown(),
    userId: z.string(),
    provider: z.string(),
    providerId: z.string().optional(),
    accountName: z.string().optional(),
    accessToken: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();
export type Connection = z.infer<typeof ConnectionSchema>;

export const ConnectionsResponseSchema = z.object({
  ok: OkLiteral,
  connections: z.array(ConnectionSchema),
});
export type ConnectionsResponse = z.infer<typeof ConnectionsResponseSchema>;

export const ConnectionCreateBodySchema = z.object({
  provider: z.string(),
  providerId: z.string().optional(),
  accountName: z.string().optional(),
  accessToken: z.string().optional(),
});
export type ConnectionCreateBody = z.infer<typeof ConnectionCreateBodySchema>;

export const ConnectionCreateResponseSchema = z.object({
  ok: OkLiteral,
  connection: ConnectionSchema,
});
export type ConnectionCreateResponse = z.infer<typeof ConnectionCreateResponseSchema>;
