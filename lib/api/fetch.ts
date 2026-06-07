import { z } from "zod";

// All app API endpoints follow this success/failure envelope shape.
// Helpers below let each call site declare only the success-data schema.
const ApiErrorEnvelopeSchema = z
  .object({
    ok: z.literal(false),
    error: z.unknown().optional(),
    message: z.string().optional(),
  })
  .passthrough();

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

// Best-effort error message extraction — handles the two response shapes used in this app:
// `{ ok: false, error }` for app routes and `{ message }` for Better Auth proxy routes.
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload !== "object" || payload === null) {
    return fallback;
  }
  const obj = payload as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message) {
    return obj.message;
  }
  if (typeof obj.error === "string" && obj.error) {
    return obj.error;
  }
  return fallback;
}

/**
 * Typed fetch helper for app API endpoints.
 * - Validates the success response against the provided schema.
 * - Throws `ApiError` on network failure, non-ok HTTP, or `{ ok: false }` payloads.
 * - Throws `ZodError` on shape mismatch so unexpected server changes surface loudly in development.
 *
 * Pass only the success-shape schema; the helper handles the error envelope.
 */
export async function apiFetch<T>(
  url: string,
  schema: z.ZodSchema<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : "Network error", 0);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Body wasn't JSON; leave payload as null and rely on status-based error below.
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      payload,
    );
  }

  // App routes use `{ ok: false, error }`; surface those as ApiError too.
  const errorEnvelope = ApiErrorEnvelopeSchema.safeParse(payload);
  if (errorEnvelope.success) {
    throw new ApiError(
      extractErrorMessage(payload, "Request failed"),
      response.status,
      payload,
    );
  }

  return schema.parse(payload);
}
