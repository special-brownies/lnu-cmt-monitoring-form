import { apiClient } from "@/lib/api/client"
import type { CurrentUser } from "@/types/auth"

type UpdateMyProfileInput = {
  name: string
  email?: string
}

export function updateMyProfile(input: UpdateMyProfileInput) {
  return apiClient<CurrentUser>("/auth/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })
}

export function uploadMyProfileImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  return apiClient<CurrentUser>("/auth/me/profile-image", {
    method: "POST",
    body: formData,
  })
}
