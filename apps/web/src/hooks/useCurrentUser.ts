"use client"

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { getToken } from '@/lib/auth'

export type CurrentUser = {
  id: string
  role: 'SUPER_ADMIN' | 'USER'
  name: string
  email?: string
  employeeId?: string
  createdAt: string
}

export function useCurrentUser() {
  const hasToken = Boolean(getToken())

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient<CurrentUser>('/auth/me', { cache: 'no-store' }),
    enabled: hasToken,
    staleTime: 60_000,
  })
}
