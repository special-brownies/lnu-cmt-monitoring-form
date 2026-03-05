const TOKEN_KEY = 'access_token'
const LEGACY_TOKEN_KEY = 'token'
const TOKEN_COOKIE_KEY = 'access_token'
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24

export type AuthRole = 'SUPER_ADMIN' | 'USER'

type AuthPayload = {
  sub: string
  role: AuthRole
  email?: string
  employeeId?: string
  name?: string
  exp?: number
}

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedToken = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY)

  if (storedToken) {
    return storedToken
  }

  return getCookieValue(TOKEN_COOKIE_KEY)
}

export function isAuthenticated(): boolean {
  const payload = getAuthPayload()

  if (!payload) {
    return false
  }

  if (!payload.exp) {
    return true
  }

  return payload.exp * 1000 > Date.now()
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(LEGACY_TOKEN_KEY, token)
  setTokenCookie(token)
}

export function logout(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  clearTokenCookie()
}

export function getAuthPayload(): AuthPayload | null {
  const token = getToken()

  if (!token) {
    return null
  }

  try {
    const segments = token.split('.')
    const payloadSegment = segments[1]

    if (!payloadSegment) {
      return null
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decodedPayload = atob(padded)

    return JSON.parse(decodedPayload) as AuthPayload
  } catch {
    return null
  }
}

export function getUserRole(): AuthRole | null {
  return getAuthPayload()?.role ?? null
}

function getCookieValue(name: string): string | null {
  const cookiePrefix = `${name}=`
  const entries = document.cookie.split(';')

  for (const entry of entries) {
    const trimmed = entry.trim()

    if (!trimmed.startsWith(cookiePrefix)) {
      continue
    }

    const value = trimmed.slice(cookiePrefix.length)
    return decodeURIComponent(value)
  }

  return null
}

function setTokenCookie(token: string): void {
  const secureSegment = window.location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax${secureSegment}`
}

function clearTokenCookie(): void {
  const secureSegment = window.location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${TOKEN_COOKIE_KEY}=; path=/; max-age=0; samesite=lax${secureSegment}`
}
