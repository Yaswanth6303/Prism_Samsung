// Public barrel: re-exports every schema + type so callers can do `from "@/types/api"`.
// Shared primitives live in _shared.ts to keep this file free of circular re-exports.
export * from "./_shared";
export * from "./profile";
export * from "./activity";
export * from "./social";
export * from "./ai";
export * from "./auth-routes";
export * from "./platform";
