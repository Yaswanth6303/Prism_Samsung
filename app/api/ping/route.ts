import { NextResponse } from "next/server"

// A tiny health check makes it easy to confirm the server is awake.
export function GET() {
  return NextResponse.json({ ok: true, now: new Date().toISOString(), message: "pong" })
}

// POST echoes the payload back so clients can quickly test request wiring.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    return NextResponse.json({ ok: true, echo: body })
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 })
  }
}
