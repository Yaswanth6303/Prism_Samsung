import { lastLoginMethodClient, emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// The browser-side auth client mirrors the server config so login state stays in sync.
export const authClient = createAuthClient({
  // Keep the base URL configurable so local development and deployed environments both work.
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [lastLoginMethodClient(), emailOTPClient()],
});
