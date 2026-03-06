const TOKEN_KEY = 'access_token'
const LEGACY_TOKEN_KEY = 'token'
const TOKEN_COOKIE_KEY = 'access_token'
const LAST_ACTIVITY_KEY = 'auth_last_activity'
const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000

export type AuthRole = 'SUPER_ADMIN' | 'USER'

type AuthPayload = {
  sub: string
  role: AuthRole
  email?: string
  employeeId?: string
  name?: string
  profileImagePath?: string
  exp?: number
}

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedToken =
    localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY)
  const cookieToken = getCookieValue(TOKEN_COOKIE_KEY)

  // Browser session cookie disappears when the browser closes.
  if (storedToken && !cookieToken) {
    clearStoredToken()
    clearSessionActivity()
    return null
  }

  if (!storedToken && cookieToken) {
    localStorage.setItem(TOKEN_KEY, cookieToken)
    localStorage.setItem(LEGACY_TOKEN_KEY, cookieToken)
    return cookieToken
  }

  if (storedToken && cookieToken && storedToken !== cookieToken) {
    localStorage.setItem(TOKEN_KEY, cookieToken)
    localStorage.setItem(LEGACY_TOKEN_KEY, cookieToken)
    return cookieToken
  }

  if (storedToken) {
    return storedToken
  }

  return cookieToken
}

export function isAuthenticated(): boolean {
  const payload = getAuthPayload()

  if (!payload) {
    return false
  }

  if (!payload.exp) {
    return !isSessionExpired()
  }

  return payload.exp * 1000 > Date.now() && !isSessionExpired()
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(LEGACY_TOKEN_KEY, token)
  setTokenCookie(token)
  markSessionActivity()
}

export function logout(): void {
  if (typeof window === 'undefined') {
    return
  }

  clearStoredToken()
  clearSessionActivity()
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

export function markSessionActivity(timestamp: number = Date.now()): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp))
}

export function isSessionExpired(now: number = Date.now()): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const rawTimestamp = localStorage.getItem(LAST_ACTIVITY_KEY)

  if (!rawTimestamp) {
    return false
  }

  const lastActivity = Number(rawTimestamp)

  if (!Number.isFinite(lastActivity) || lastActivity <= 0) {
    return false
  }

  return now - lastActivity > getSessionTimeoutMs()
}

export function getSessionTimeoutMs(): number {
  const rawValue = process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS
  const parsedValue = rawValue ? Number(rawValue) : NaN

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_SESSION_TIMEOUT_MS
  }

  return parsedValue
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
  // Session cookie: expires when the browser closes.
  document.cookie = `${TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; path=/; samesite=lax${secureSegment}`
}

function clearTokenCookie(): void {
  const secureSegment = window.location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${TOKEN_COOKIE_KEY}=; path=/; max-age=0; samesite=lax${secureSegment}`
}

function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

function clearSessionActivity(): void {
  localStorage.removeItem(LAST_ACTIVITY_KEY)
}
