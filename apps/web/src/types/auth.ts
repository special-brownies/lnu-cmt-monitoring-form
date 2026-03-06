export type AuthRole = "SUPER_ADMIN" | "USER"

export type CurrentUser = {
  id: string
  role: AuthRole
  name: string
  email?: string
  employeeId?: string
  profileImagePath?: string | null
  createdAt: string
}
