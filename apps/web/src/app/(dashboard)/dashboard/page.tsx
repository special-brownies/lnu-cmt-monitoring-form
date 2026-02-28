"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, logout } from '@/lib/auth'

type EquipmentResponse = {
  success?: boolean
  data?: unknown
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [equipmentData, setEquipmentData] = useState<unknown>(null)

  useEffect(() => {
    const token = getToken()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!token) {
      router.replace('/login')
      return
    }

    if (!apiUrl) {
      setError('Missing NEXT_PUBLIC_API_URL')
      setLoading(false)
      return
    }

    const loadEquipment = async () => {
      try {
        const response = await fetch(`${apiUrl}/equipment`, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = (await response.json()) as EquipmentResponse

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        setEquipmentData(payload?.data ?? payload)
      } catch (fetchError) {
        console.error('Dashboard fetch failed:', fetchError)
        setError(
          fetchError instanceof Error ? fetchError.message : 'Failed to load data',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadEquipment()
  }, [router])

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Debug Dashboard</h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Logout
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          API URL: {process.env.NEXT_PUBLIC_API_URL}
        </p>

        {loading && <p className="mt-6 text-slate-600">Loading equipment data...</p>}

        {error && <p className="mt-6 text-red-600">{error}</p>}

        {!loading && !error && (
          <pre className="mt-6 max-h-[500px] overflow-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(equipmentData, null, 2)}
          </pre>
        )}
      </div>
    </main>
  )
}
