import { apiClient } from "@/lib/api/client"
import {
  notifyPasswordRequestResolved,
  notifyPasswordRequestSubmitted,
} from "@/lib/activity-toast"

export type PasswordRequestRecord = {
  id: string
  status: "PENDING" | "COMPLETED"
  requestedAt: string
  resolvedAt: string | null
  faculty: {
    id: string
    employeeId: string
    name: string
  }
}

type ResolvePasswordRequestInput = {
  requestId: string
  newPassword: string
}

const REQUEST_SUBMITTED_FALLBACK_MESSAGE =
  "If an account exists, a request has been submitted"

export function getPasswordRequests() {
  return apiClient<PasswordRequestRecord[]>("/password-requests", {
    cache: "no-store",
  })
}

export async function submitPasswordRequest(employeeId: string) {
  try {
    const result = await apiClient<{ message?: string }>("/password-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ employeeId: employeeId.trim().toUpperCase() }),
    })

    notifyPasswordRequestSubmitted()
    return result.message ?? REQUEST_SUBMITTED_FALLBACK_MESSAGE
  } catch {
    notifyPasswordRequestSubmitted()
    return REQUEST_SUBMITTED_FALLBACK_MESSAGE
  }
}

export async function resolvePasswordRequest(payload: ResolvePasswordRequestInput) {
  const resolved = await apiClient<PasswordRequestRecord>(
    `/password-requests/${payload.requestId}/resolve`,
    {
      method: "POST",
      body: JSON.stringify({ newPassword: payload.newPassword }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  )

  notifyPasswordRequestResolved(resolved.faculty.name)
  return resolved
}
