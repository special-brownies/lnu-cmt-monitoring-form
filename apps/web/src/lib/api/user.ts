import { apiClient } from "@/lib/api/client"
import type {
  CreateSuperAdminInput,
  SuperAdminRecord,
  UpdateSuperAdminInput,
} from "@/types/user"

const JSON_HEADERS = {
  "Content-Type": "application/json",
}

export function createSuperAdmin(input: CreateSuperAdminInput) {
  return apiClient<SuperAdminRecord>("/users", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      role: "SUPER_ADMIN",
      name: input.name,
      email: input.email,
      password: input.password,
      status: input.status,
    }),
  })
}

export function getSuperAdminList() {
  return apiClient<SuperAdminRecord[]>("/users", {
    cache: "no-store",
  })
}

export function updateSuperAdmin(input: UpdateSuperAdminInput) {
  return apiClient<SuperAdminRecord>(`/users/${input.id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      status: input.status,
    }),
  })
}

export function deleteSuperAdmin(id: string) {
  return apiClient<SuperAdminRecord>(`/users/${id}`, {
    method: "DELETE",
  })
}
