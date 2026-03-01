type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string | string[]
  error?: string
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

  if (!baseUrl) {
    throw new Error('Missing NEXT_PUBLIC_API_URL')
  }

  return baseUrl
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem('access_token') ?? localStorage.getItem('token')
}

function normalizeErrorMessage(payload: unknown, fallbackStatusText: string) {
  if (!payload || typeof payload !== 'object') {
    return fallbackStatusText || 'Request failed'
  }

  const possibleMessage = (payload as ApiEnvelope<unknown>).message
  if (Array.isArray(possibleMessage)) {
    return possibleMessage.join(', ')
  }

  if (typeof possibleMessage === 'string' && possibleMessage.length > 0) {
    return possibleMessage
  }

  const error = (payload as ApiEnvelope<unknown>).error
  if (typeof error === 'string' && error.length > 0) {
    return error
  }

  return fallbackStatusText || 'Request failed'
}

export async function apiClient<T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const token = getAuthToken()
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const headers = new Headers(init.headers)
  const hasBody = init.body !== undefined && init.body !== null
  const isFormDataBody = typeof FormData !== 'undefined' && init.body instanceof FormData

  if (!headers.has('Content-Type') && hasBody && !isFormDataBody) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${normalizedEndpoint}`, {
    ...init,
    credentials: 'include',
    headers,
    body:
      hasBody && !isFormDataBody && typeof init.body !== 'string'
        ? JSON.stringify(init.body)
        : init.body,
  })

  const isNoContent = response.status === 204 || response.status === 205
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  let payload: unknown = null

  if (!isNoContent) {
    const rawBody = await response.text()

    if (rawBody.length > 0) {
      payload = isJson ? JSON.parse(rawBody) : rawBody
    }
  }

  if (!response.ok) {
    throw new ApiError(
      normalizeErrorMessage(payload, response.statusText),
      response.status,
      payload,
    )
  }

  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return (payload as ApiEnvelope<T>).data as T
  }

  return payload as T
}
