import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory sliding-window rate limiter for expensive / attackable API routes.
// Runs per serverless instance — intentionally simple, no infra dependencies.
// Swap `hits` for Upstash Ratelimit if you deploy to multiple instances.
type Bucket = { count: number; resetAt: number };
const hits = new Map<string, Bucket>();

const RATE_RULES: { prefix: string; limit: number; windowMs: number }[] = [
  { prefix: "/api/auth", limit: 20, windowMs: 60_000 },
  { prefix: "/api/clawmind", limit: 20, windowMs: 60_000 },
  { prefix: "/api/ai", limit: 30, windowMs: 60_000 },
];

function ipFrom(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {return forwarded.split(",")[0].trim();}
  return request.headers.get("x-real-ip") ?? "anonymous";
}

function rateLimit(request: NextRequest): NextResponse | null {
  const rule = RATE_RULES.find((r) => request.nextUrl.pathname.startsWith(r.prefix));
  if (!rule) {return null;}

  const key = `${rule.prefix}:${ipFrom(request)}`;
  const now = Date.now();
  const bucket = hits.get(key);

  if (!bucket || bucket.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > rule.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return new NextResponse(
      JSON.stringify({ ok: false, error: "Too many requests" }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(retryAfter),
        },
      },
    );
  }
  return null;
}

export function proxy(request: NextRequest) {
  // Rate-limit the sensitive API paths first — cheap, and short-circuits before any auth work.
  const limited = rateLimit(request);
  if (limited) {return limited;}

  // Auth-redirect logic only applies to page routes, not the API paths that reached us via the matcher.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Better Auth stores the session token in a cookie.
  // In development it's better-auth.session_token, in production it's __Secure-better-auth.session_token
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const url = request.nextUrl.clone();

  const authPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthPath = authPaths.includes(url.pathname);
  const isLandingPage = url.pathname === "/";

  // If the user is logged in and trying to access auth pages or landing page, redirect to dashboard
  if (sessionCookie && (isAuthPath || isLandingPage)) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If the user is NOT logged in and trying to access a protected page, redirect to landing page
  if (!sessionCookie && !isAuthPath && !isLandingPage) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Page routes: run the auth-redirect logic on everything that isn't an API/static asset.
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
    // Rate-limited API routes.
    "/api/auth/:path*",
    "/api/clawmind",
    "/api/ai/:path*",
  ],
};
