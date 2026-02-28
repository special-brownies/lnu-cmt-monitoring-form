"use client"

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [employeeId, setEmployeeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
      setMessage('Missing NEXT_PUBLIC_API_URL')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${apiUrl}/password-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employeeId.trim().toUpperCase() }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      setMessage('If an account exists, a request has been submitted')
      setEmployeeId('')
    } catch {
      setMessage('If an account exists, a request has been submitted')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Forgot password</h1>
          <p className="text-sm text-slate-500">
            Enter your employee ID to submit a helpdesk password request.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="employeeId" className="text-sm font-medium text-slate-700">
              Employee ID
            </label>
            <Input
              id="employeeId"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              placeholder="FAC-1001"
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit request'}
          </Button>
        </form>

        {message && (
          <p role="status" className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {message}
          </p>
        )}

        <Link href="/login" className="block text-sm font-medium text-slate-700 hover:text-slate-900">
          Back to login
        </Link>
      </section>
    </main>
  )
}
