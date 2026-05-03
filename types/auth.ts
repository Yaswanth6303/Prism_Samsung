/**
 * Centralized type definitions for authentication-related entities.
 */

/** Shape of an error returned by Better Auth. */
export type AuthError = {
  code?: string;
  message?: string;
  status?: number;
};

/** A single active session record. */
export type SessionInfo = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Props accepted by the SocialAuthButtons component. */
export type SocialAuthButtonsProps = {
  signInWithGoogle: () => void;
  signInWithGithub: () => void;
  isGoogleLoading: boolean;
  isGithubLoading: boolean;
  lastUsedMethod?: "google" | "github";
};
