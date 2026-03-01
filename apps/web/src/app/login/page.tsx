"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Eye, EyeOff, IdCard, Lock, Mail } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { InputWithIcon } from '@/components/ui/input-with-icon'
import { getToken, setToken } from '@/lib/auth'
import { getRoleLabel } from '@/lib/role-label'

type LoginType = 'admin' | 'faculty'

type LoginResponse = {
  access_token?: string
  message?: string
}

type FormErrors = {
  email?: string
  employeeId?: string
  password?: string
}

const adminSchema = z.object({
  email: z.email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const facultySchema = z.object({
  employeeId: z.string().min(3, 'Employee ID is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function LoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<LoginType>('faculty')
  const [email, setEmail] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (getToken()) {
      router.replace('/dashboard')
    }
  }, [router])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeout = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timeout)
  }, [toast])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})

    if (loginType === 'admin') {
      const parsed = adminSchema.safeParse({ email, password })

      if (!parsed.success) {
        const flattened = parsed.error.flatten().fieldErrors
        setErrors({
          email: flattened.email?.[0],
          password: flattened.password?.[0],
        })
        return
      }
    } else {
      const parsed = facultySchema.safeParse({ employeeId, password })

      if (!parsed.success) {
        const flattened = parsed.error.flatten().fieldErrors
        setErrors({
          employeeId: flattened.employeeId?.[0],
          password: flattened.password?.[0],
        })
        return
      }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
      setToast('Missing NEXT_PUBLIC_API_URL')
      return
    }

    const endpoint =
      loginType === 'admin' ? '/auth/login/admin' : '/auth/login/faculty'

    const body =
      loginType === 'admin'
        ? { email: email.trim(), password }
        : { employeeId: employeeId.trim().toUpperCase(), password }

    setLoading(true)

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const payload = (await response.json()) as LoginResponse

      if (!response.ok || !payload.access_token) {
        setToast('Invalid credentials')
        return
      }

      setToken(payload.access_token)

      if (!rememberMe) {
        // Placeholder for future token/session persistence strategy.
      }

      router.replace('/dashboard')
    } catch (loginError) {
      console.error('Login request failed:', loginError)
      setToast('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  function handleRememberChange(event: ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked
    setRememberMe(checked)
    localStorage.setItem('rememberMe', checked.toString())
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}

      <section className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="space-y-4">
          <div className="mb-6 flex items-center gap-3">
            <Image
              src="/assets/lnu-logo.png"
              alt="LNU Logo"
              width={48}
              height={48}
              priority
            />
            <span className="text-xl font-semibold">CMT Monitoring System</span>
          </div>

          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to your monitoring dashboard</p>
          </div>

          <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setLoginType('faculty')
                setErrors({})
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                loginType === 'faculty'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('admin')
                setErrors({})
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                loginType === 'admin'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {getRoleLabel('SUPER_ADMIN')}
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          {loginType === 'admin' ? (
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <InputWithIcon
                id="email"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@lnu.local"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <label htmlFor="employeeId" className="text-sm font-medium text-slate-700">
                Employee ID
              </label>
              <InputWithIcon
                id="employeeId"
                icon={<IdCard className="h-4 w-4" />}
                type="text"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                placeholder="FAC-1001"
                aria-invalid={Boolean(errors.employeeId)}
                aria-describedby={errors.employeeId ? 'employeeId-error' : undefined}
              />
              {errors.employeeId && (
                <p id="employeeId-error" className="text-xs text-red-600">
                  {errors.employeeId}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <InputWithIcon
              id="password"
              icon={<Lock className="h-4 w-4" />}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-slate-500 transition hover:text-slate-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberChange}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Remember me
            </label>

            <Link
              href="/forgot-password"
              className="font-medium text-slate-700 transition-colors hover:text-slate-900"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </section>
    </main>
  )
}
