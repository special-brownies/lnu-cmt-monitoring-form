"use client"

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthRole, getUserRole, isAuthenticated, logout } from '@/lib/auth'

type AuthGuardProps = {
  children: ReactNode
  allowedRoles?: AuthRole[]
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const authenticated = isAuthenticated()
  const currentRole = getUserRole()
  const hasAllowedRole =
    !allowedRoles || allowedRoles.length === 0 || (currentRole ? allowedRoles.includes(currentRole) : false)

  useEffect(() => {
    if (!authenticated) {
      logout()
      router.replace('/login')
      return
    }

    if (!hasAllowedRole) {
      router.replace('/dashboard')
    }
  }, [authenticated, hasAllowedRole, router])

  if (!authenticated || !hasAllowedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="inline-flex items-center gap-2 text-sm text-slate-700">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          Checking authentication...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
