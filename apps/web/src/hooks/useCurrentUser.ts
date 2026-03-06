"use client"

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { getToken } from '@/lib/auth'
import type { CurrentUser } from '@/types/auth'

export function useCurrentUser() {
  const hasToken = Boolean(getToken())

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient<CurrentUser>('/auth/me', { cache: 'no-store' }),
    enabled: hasToken,
    staleTime: 60_000,
  })
}
