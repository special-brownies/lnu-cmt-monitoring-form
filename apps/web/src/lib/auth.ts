const TOKEN_KEY = 'access_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
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
