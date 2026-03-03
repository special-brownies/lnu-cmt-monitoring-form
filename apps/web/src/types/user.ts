import type { FacultyStatus } from "@/types/faculty"

export type CreateSuperAdminInput = {
  name: string
  email: string
  password: string
  status: FacultyStatus
}

export type SuperAdminRecord = {
  id: string
  name: string
  email: string
  role: "SUPER_ADMIN"
  status?: string
  createdAt: string
  updatedAt: string
}

export type UpdateSuperAdminInput = {
  id: string
  name: string
  email: string
  status: FacultyStatus
}
