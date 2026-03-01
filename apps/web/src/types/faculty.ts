export type FacultyStatus = "ACTIVE" | "INACTIVE"

export type FacultyRecord = {
  id: string
  name: string
  employeeId: string
  createdAt: string
  updatedAt: string
  status?: string
}

export type CreateFacultyInput = {
  name: string
  employeeId: string
  password: string
  status: FacultyStatus
}

export type UpdateFacultyInput = {
  id: string
  name: string
  employeeId: string
  status: FacultyStatus
}

export type ResetFacultyPasswordInput = {
  id: string
  password: string
}

export function getFacultyStatus(faculty: FacultyRecord): FacultyStatus {
  if (String(faculty.status ?? "").toUpperCase() === "INACTIVE") {
    return "INACTIVE"
  }

  return "ACTIVE"
}
