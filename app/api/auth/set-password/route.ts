import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth/server";

// better-auth's setPassword endpoint isn't exposed over HTTP, so we wrap it here
// for OAuth-only users who want to add a password to their account.
export async function POST(req: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: { newPassword?: unknown };
  try {
    body = (await req.json()) as { newPassword?: unknown };
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const newPassword = body?.newPassword;
  if (typeof newPassword !== "string" || newPassword.length === 0) {
    return NextResponse.json({ message: "newPassword is required" }, { status: 400 });
  }

  try {
    const result = await auth.api.setPassword({
      body: { newPassword },
      headers: requestHeaders,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof APIError) {
      const body = (err.body ?? {}) as { message?: string; code?: string };
      return NextResponse.json(
        { message: body.message ?? err.message, code: body.code },
        { status: err.statusCode ?? 400 },
      );
    }
    return NextResponse.json({ message: "Failed to set password" }, { status: 500 });
  }
}
