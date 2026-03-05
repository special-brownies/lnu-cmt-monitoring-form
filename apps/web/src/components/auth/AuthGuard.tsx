"use client"

import { ReactNode, useEffect, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  AuthRole,
  getUserRole,
  isAuthenticated,
  logout,
  markSessionActivity,
} from '@/lib/auth'

type AuthGuardProps = {
  children: ReactNode
  allowedRoles?: AuthRole[]
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )
  const authenticated = isAuthenticated()
  const currentRole = getUserRole()
  const hasAllowedRole =
    !allowedRoles || allowedRoles.length === 0 || (currentRole ? allowedRoles.includes(currentRole) : false)

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (!authenticated) {
      logout()
      router.replace('/login')
      return
    }

    if (!hasAllowedRole) {
      router.replace('/dashboard')
    }
  }, [authenticated, hasAllowedRole, hydrated, router])

  useEffect(() => {
    if (!hydrated || !authenticated) {
      return
    }

    markSessionActivity()
  }, [authenticated, hydrated, pathname])

  useEffect(() => {
    if (!hydrated || !authenticated) {
      return
    }

    let lastActivityMark = 0
    const updateActivity = () => {
      const now = Date.now()

      if (now - lastActivityMark < 5_000) {
        return
      }

      lastActivityMark = now
      markSessionActivity(now)
    }

    const events: Array<keyof WindowEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'touchstart',
      'scroll',
    ]

    for (const eventName of events) {
      window.addEventListener(eventName, updateActivity, { passive: true })
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, updateActivity)
      }
    }
  }, [authenticated, hydrated])

  useEffect(() => {
    if (!hydrated || !authenticated) {
      return
    }

    const timer = window.setInterval(() => {
      if (isAuthenticated()) {
        return
      }

      logout()
      router.replace('/login')
    }, 5_000)

    return () => window.clearInterval(timer)
  }, [authenticated, hydrated, router])

  if (!hydrated || !authenticated || !hasAllowedRole) {
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
