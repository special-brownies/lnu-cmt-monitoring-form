"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthRole, getUserRole, isAuthenticated } from '@/lib/auth'

type AuthGuardProps = {
  children: ReactNode
  allowedRoles?: AuthRole[]
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const role = getUserRole()

      if (!role || !allowedRoles.includes(role)) {
        router.replace('/dashboard')
        return
      }
    }

    setCheckingAuth(false)
  }, [allowedRoles, router])

  if (checkingAuth) {
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
