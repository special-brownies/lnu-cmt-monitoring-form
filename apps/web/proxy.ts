import { NextRequest, NextResponse } from 'next/server'

const LOGIN_PATH = '/login'
const DASHBOARD_PATH = '/dashboard'
const AUTH_COOKIE_KEY = 'access_token'
const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/analytics',
  '/users',
  '/equipment',
  '/maintenance',
]

type JwtPayload = {
  exp?: number
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_KEY)?.value
  const tokenPayload = token ? decodePayload(token) : null
  const tokenExpired = isTokenExpired(tokenPayload)
  const isAuthenticated = Boolean(token && tokenPayload && !tokenExpired)
  const isProtectedPath = PROTECTED_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  )

  if (pathname === LOGIN_PATH && isAuthenticated) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url))
  }

  if (isProtectedPath && !isAuthenticated) {
    const redirectResponse = NextResponse.redirect(new URL(LOGIN_PATH, request.url))

    if (token) {
      redirectResponse.cookies.delete(AUTH_COOKIE_KEY)
    }

    return redirectResponse
  }

  const response = NextResponse.next()

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/analytics/:path*',
    '/users/:path*',
    '/equipment/:path*',
    '/maintenance/:path*',
  ],
}

function decodePayload(token: string): JwtPayload | null {
  try {
    const segments = token.split('.')
    const payloadSegment = segments[1]

    if (!payloadSegment) {
      return null
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = atob(padded)

    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

function isTokenExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) {
    return false
  }

  return payload.exp * 1000 <= Date.now()
}
