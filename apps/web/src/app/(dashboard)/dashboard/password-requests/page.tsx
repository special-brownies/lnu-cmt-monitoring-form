"use client"

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getToken, logout } from '@/lib/auth'

type PasswordRequestRecord = {
  id: string
  status: 'PENDING' | 'COMPLETED'
  requestedAt: string
  resolvedAt: string | null
  faculty: {
    id: string
    employeeId: string
    name: string
  }
}

type PasswordRequestListResponse = {
  success: boolean
  data: PasswordRequestRecord[]
}

export default function PasswordRequestsPage() {
  return (
    <AuthGuard allowedRoles={['SUPER_ADMIN']}>
      <PasswordRequestsContent />
    </AuthGuard>
  )
}

function PasswordRequestsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<PasswordRequestRecord[]>([])
  const [selectedRequest, setSelectedRequest] = useState<PasswordRequestRecord | null>(
    null,
  )
  const [newPassword, setNewPassword] = useState('')
  const [resolving, setResolving] = useState(false)

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL, [])

  useEffect(() => {
    const token = getToken()

    if (!token) {
      router.replace('/login')
      return
    }

    if (!apiUrl) {
      setError('Missing NEXT_PUBLIC_API_URL')
      setLoading(false)
      return
    }

    const loadRequests = async () => {
      try {
        const response = await fetch(`${apiUrl}/password-requests`, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = (await response.json()) as PasswordRequestListResponse

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        setRequests(payload.data ?? [])
      } catch (loadError) {
        console.error('Failed to load password requests:', loadError)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load requests')
      } finally {
        setLoading(false)
      }
    }

    void loadRequests()
  }, [apiUrl, router])

  async function handleResolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedRequest) {
      return
    }

    const token = getToken()

    if (!token || !apiUrl) {
      setError('Missing authentication or API configuration')
      return
    }

    setResolving(true)

    try {
      const response = await fetch(
        `${apiUrl}/password-requests/${selectedRequest.id}/resolve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword }),
        },
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === selectedRequest.id
            ? {
                ...request,
                status: 'COMPLETED',
                resolvedAt: new Date().toISOString(),
              }
            : request,
        ),
      )

      setSelectedRequest(null)
      setNewPassword('')
    } catch (resolveError) {
      console.error('Failed to resolve password request:', resolveError)
      setError(resolveError instanceof Error ? resolveError.message : 'Failed to resolve request')
    } finally {
      setResolving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Password Requests</h1>
            <p className="text-sm text-slate-600">
              Resolve faculty password requests from the helpdesk queue.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" className="w-auto px-4" onClick={() => router.push('/dashboard')}>
              Back
            </Button>
            <Button
              type="button"
              className="w-auto px-4 bg-slate-700 hover:bg-slate-600"
              onClick={() => {
                logout()
                router.replace('/login')
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-600">Loading requests...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Faculty Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Requested At</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No password requests found.
                    </td>
                  </tr>
                )}

                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 text-slate-800">{request.faculty.employeeId}</td>
                    <td className="px-4 py-3 text-slate-800">{request.faculty.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          request.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(request.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        className="w-auto px-3 py-2 text-xs"
                        disabled={request.status !== 'PENDING'}
                        onClick={() => setSelectedRequest(request)}
                      >
                        Resolve
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Resolve Request</h2>
            <p className="mt-1 text-sm text-slate-600">
              Set a new password for {selectedRequest.faculty.employeeId}.
            </p>

            <form onSubmit={handleResolve} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  className="w-auto bg-slate-200 px-4 text-slate-800 hover:bg-slate-300"
                  onClick={() => {
                    setSelectedRequest(null)
                    setNewPassword('')
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-auto px-4" disabled={resolving}>
                  {resolving ? 'Resolving...' : 'Confirm'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
