import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = ['/login']
const sessionCookieNames = ['authjs.session-token', '__Secure-authjs.session-token']

function hasSessionCookie(request: NextRequest) {
  return sessionCookieNames.some((name) => Boolean(request.cookies.get(name)?.value))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  const isSignedIn = hasSessionCookie(request)

  if (!isSignedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', request.nextUrl)
    loginUrl.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (isSignedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
