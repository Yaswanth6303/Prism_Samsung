import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ ok: true, now: new Date().toISOString(), message: "pong" })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({ ok: true, echo: body })
  } catch (err) {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 })
  }
}
