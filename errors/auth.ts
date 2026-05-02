import type { AuthError } from "@/types";

export function getSignUpErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "USER_ALREADY_EXISTS":
      return "An account with this email already exists. Try logging in instead.";
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    case "WEAK_PASSWORD":
    case "INVALID_PASSWORD":
      return "Password is too weak. Please use a stronger password.";
    case "RATE_LIMIT_EXCEEDED":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}

export function getSignInErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Incorrect email or password. Please try again.";
    case "USER_NOT_FOUND":
      return "No account found with this email. Please sign up first.";
    case "INVALID_PASSWORD":
      return "Incorrect password. Please try again.";
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    case "TOO_MANY_REQUESTS":
    case "RATE_LIMIT_EXCEEDED":
      return "Too many login attempts. Please wait a moment and try again.";
    case "ACCOUNT_LOCKED":
      return "Your account has been locked. Please contact support.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}
