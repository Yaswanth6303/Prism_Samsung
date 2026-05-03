import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Better Auth stores the session token in a cookie.
  // In development it's better-auth.session_token, in production it's __Secure-better-auth.session_token
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const url = request.nextUrl.clone();

  const authPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];
  const isAuthPath = authPaths.includes(url.pathname);
  const isLandingPage = url.pathname === "/";

  // If the user is logged in and trying to access auth pages or landing page, redirect to dashboard
  if (sessionCookie && (isAuthPath || isLandingPage)) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If the user is NOT logged in and trying to access a protected page, redirect to login
  if (!sessionCookie && !isAuthPath && !isLandingPage) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run proxy on all routes except API routes, static files, images, etc.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
