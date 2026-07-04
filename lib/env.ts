import { z } from "zod";

// Central env schema — every env var the server touches is declared here and validated at boot.
// If a required var is missing, `next build` and `next dev` fail loudly instead of a request 500ing later.

const serverSchema = z.object({
  // Mongo: the codebase uses both names historically. We accept either and normalize below.
  MONGO_DB_URL: z.string().url().optional(),
  MONGODB_URI: z.string().url().optional(),
  MONGODB_DB: z.string().min(1).default("clawmind"),

  // better-auth
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url().optional(),

  // OAuth providers
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().min(1),
  // Accept a bare address (`x@y.com`) or Resend's display-name form (`Name <x@y.com>`).
  RESEND_FROM_EMAIL: z
    .string()
    .min(1)
    .refine(
      (value) => /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value.trim()) || /<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>/.test(value),
      { message: "Must be an email or 'Name <email@domain>'" },
    ),

  // Encrypts user-supplied provider tokens before they hit Mongo.
  ENCRYPTION_SECRET: z.string().min(32),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

function readEnv() {
  const mongo = process.env.MONGO_DB_URL || process.env.MONGODB_URI;
  const parsedServer = serverSchema.safeParse(process.env);
  const parsedClient = clientSchema.safeParse(process.env);

  if (!parsedServer.success || !parsedClient.success || !mongo) {
    const issues: string[] = [];
    if (!mongo) {issues.push("MONGO_DB_URL (or MONGODB_URI) is required");}
    if (!parsedServer.success) {
      for (const issue of parsedServer.error.issues) {
        issues.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }
    if (!parsedClient.success) {
      for (const issue of parsedClient.error.issues) {
        issues.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }
    throw new Error(`Invalid environment configuration:\n  - ${issues.join("\n  - ")}`);
  }

  return {
    ...parsedServer.data,
    ...parsedClient.data,
    MONGO_URL: mongo,
  };
}

export const env = readEnv();
export type Env = typeof env;
