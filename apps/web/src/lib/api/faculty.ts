import { ApiError, apiClient } from "@/lib/api/client"
import type {
  CreateFacultyInput,
  FacultyRecord,
  ResetFacultyPasswordInput,
  UpdateFacultyInput,
} from "@/types/faculty"

const JSON_HEADERS = {
  "Content-Type": "application/json",
}

function shouldFallbackStatus(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false
  }

  if (error.status !== 400 || !error.payload || typeof error.payload !== "object") {
    return false
  }

  const payload = error.payload as { message?: string | string[] }
  const messageText = Array.isArray(payload.message)
    ? payload.message.join(" ")
    : payload.message ?? ""

  return messageText.toLowerCase().includes("status") && messageText.toLowerCase().includes("should not exist")
}

export function getFacultyList() {
  return apiClient<FacultyRecord[]>("/faculty", { cache: "no-store" })
}

export async function createFaculty(input: CreateFacultyInput) {
  const withStatus = {
    name: input.name,
    employeeId: input.employeeId,
    password: input.password,
    status: input.status,
  }

  try {
    return await apiClient<FacultyRecord>("/faculty", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(withStatus),
    })
  } catch (error) {
    if (!shouldFallbackStatus(error)) {
      throw error
    }

    return apiClient<FacultyRecord>("/faculty", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        name: input.name,
        employeeId: input.employeeId,
        password: input.password,
      }),
    })
  }
}

export async function updateFaculty(input: UpdateFacultyInput) {
  const withStatus = {
    name: input.name,
    employeeId: input.employeeId,
    status: input.status,
  }

  try {
    return await apiClient<FacultyRecord>(`/faculty/${input.id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(withStatus),
    })
  } catch (error) {
    if (!shouldFallbackStatus(error)) {
      throw error
    }

    return apiClient<FacultyRecord>(`/faculty/${input.id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        name: input.name,
        employeeId: input.employeeId,
      }),
    })
  }
}

export async function resetFacultyPassword(input: ResetFacultyPasswordInput) {
  try {
    return await apiClient<FacultyRecord>(`/faculty/${input.id}/reset-password`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ password: input.password }),
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error
    }

    return apiClient<FacultyRecord>(`/faculty/${input.id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ password: input.password }),
    })
  }
}

export function deleteFaculty(id: string) {
  return apiClient<FacultyRecord>(`/faculty/${id}`, {
    method: "DELETE",
  })
}
