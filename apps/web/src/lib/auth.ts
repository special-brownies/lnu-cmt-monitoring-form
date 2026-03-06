const TOKEN_KEY = 'access_token'
const LEGACY_TOKEN_KEY = 'token'
const TOKEN_COOKIE_KEY = 'access_token'
const LAST_ACTIVITY_KEY = 'auth_last_activity'
const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000
const SESSION_MARKER_KEY = 'auth_browser_session'
const ACTIVE_TABS_KEY = 'auth_active_tabs'
const TAB_ID_KEY = 'auth_tab_id'
const ACTIVE_TAB_HEARTBEAT_MS = 10_000
const ACTIVE_TAB_STALE_MS = 30_000

let lifecycleInitialized = false
let activeTabId: string | null = null
let heartbeatHandle: number | null = null

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

  ensureLifecycleInitialized()

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

  ensureLifecycleInitialized()
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

function ensureLifecycleInitialized(): void {
  if (typeof window === 'undefined' || lifecycleInitialized) {
    return
  }

  lifecycleInitialized = true
  activeTabId = getOrCreateTabId()

  const now = Date.now()
  const activeTabs = pruneStaleTabs(readActiveTabs(), now)
  const hasSessionMarker = sessionStorage.getItem(SESSION_MARKER_KEY) === '1'
  const hasOtherActiveTabs = Object.keys(activeTabs).some((tabId) => tabId !== activeTabId)

  if (!hasSessionMarker && !hasOtherActiveTabs) {
    clearStoredToken()
    clearSessionActivity()
    clearTokenCookie()
  }

  sessionStorage.setItem(SESSION_MARKER_KEY, '1')
  touchActiveTab(now)

  heartbeatHandle = window.setInterval(() => {
    touchActiveTab()
  }, ACTIVE_TAB_HEARTBEAT_MS)

  const unregisterTab = () => {
    if (!activeTabId) {
      return
    }

    const tabs = readActiveTabs()

    if (tabs[activeTabId]) {
      delete tabs[activeTabId]
      writeActiveTabs(tabs)
    }

    if (heartbeatHandle !== null) {
      window.clearInterval(heartbeatHandle)
      heartbeatHandle = null
    }
  }

  window.addEventListener('beforeunload', unregisterTab)
  window.addEventListener('pagehide', unregisterTab)
}

function touchActiveTab(timestamp: number = Date.now()): void {
  if (!activeTabId) {
    return
  }

  const tabs = pruneStaleTabs(readActiveTabs(), timestamp)
  tabs[activeTabId] = timestamp
  writeActiveTabs(tabs)
}

function getOrCreateTabId(): string {
  const existing = sessionStorage.getItem(TAB_ID_KEY)

  if (existing) {
    return existing
  }

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`

  sessionStorage.setItem(TAB_ID_KEY, generated)
  return generated
}

function readActiveTabs(): Record<string, number> {
  try {
    const rawValue = localStorage.getItem(ACTIVE_TABS_KEY)

    if (!rawValue) {
      return {}
    }

    const parsed = JSON.parse(rawValue) as Record<string, unknown>
    const result: Record<string, number> = {}

    for (const [tabId, timestamp] of Object.entries(parsed)) {
      const numericTimestamp = Number(timestamp)

      if (!Number.isFinite(numericTimestamp) || numericTimestamp <= 0) {
        continue
      }

      result[tabId] = numericTimestamp
    }

    return result
  } catch {
    return {}
  }
}

function writeActiveTabs(value: Record<string, number>): void {
  try {
    if (Object.keys(value).length === 0) {
      localStorage.removeItem(ACTIVE_TABS_KEY)
      return
    }

    localStorage.setItem(ACTIVE_TABS_KEY, JSON.stringify(value))
  } catch {
    // Ignore storage write failures and continue.
  }
}

function pruneStaleTabs(
  value: Record<string, number>,
  now: number,
): Record<string, number> {
  const result: Record<string, number> = {}

  for (const [tabId, timestamp] of Object.entries(value)) {
    if (now - timestamp > ACTIVE_TAB_STALE_MS) {
      continue
    }

    result[tabId] = timestamp
  }

  return result
}
