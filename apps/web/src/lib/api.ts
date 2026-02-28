type ApiFetchOptions = RequestInit & {
  token?: string
}

const API_URL =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL?.replace(/\/$/, '')
    : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

if (!API_URL) {
  console.error('Missing API URL configuration')
}

console.log('Using API URL:', API_URL)

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}) {
  if (!API_URL) {
    throw new Error('API URL is not configured')
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  })

  const hasBody = options.body !== undefined && options.body !== null
  const isStringBody = typeof options.body === 'string'

  const localToken =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') ?? localStorage.getItem('token')
      : null

  const token = options.token ?? localToken

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${normalizedEndpoint}`, {
    ...options,
    headers,
    body: hasBody && !isStringBody ? JSON.stringify(options.body) : options.body,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
