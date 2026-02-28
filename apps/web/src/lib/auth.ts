const TOKEN_KEY = 'access_token'

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

  return localStorage.getItem(TOKEN_KEY)
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
}

export function logout(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('token')
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
