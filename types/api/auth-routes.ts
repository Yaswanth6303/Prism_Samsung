import { z } from "zod";

import { OkLiteral } from "./_shared";

// /api/auth/delete-account returns either `{ ok: true }` or `{ message: string }` on failure.
export const DeleteAccountResponseSchema = z.object({
  ok: OkLiteral,
});
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;

// /api/auth/set-password proxies Better Auth, which returns provider-specific success bodies.
// We don't constrain the success shape since the client only checks HTTP status.
export const SetPasswordBodySchema = z.object({
  newPassword: z.string().min(1),
});
export type SetPasswordBody = z.infer<typeof SetPasswordBodySchema>;
