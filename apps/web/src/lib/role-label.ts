export function getRoleLabel(role: string) {
  if (role === "SUPER_ADMIN") return "Admin"
  if (role === "USER") return "User"
  return role
}
