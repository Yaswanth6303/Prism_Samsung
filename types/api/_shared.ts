import { z } from "zod";

// Marker for the success branch of every app API response. Each endpoint schema spreads this in.
export const OkLiteral = z.literal(true);

// Generic ok-only response, used for endpoints that return `{ ok: true }` with no extra data.
export const OkOnlySchema = z.object({ ok: OkLiteral });
export type OkOnlyResponse = z.infer<typeof OkOnlySchema>;
