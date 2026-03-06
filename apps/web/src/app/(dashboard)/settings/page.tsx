"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { ProfileSettingsPanel } from "@/components/profile/profile-settings-panel"

export default function SettingsPage() {
  const router = useRouter()
  const { data: currentUser, isLoading } = useCurrentUser()

  useEffect(() => {
    if (currentUser?.role === "USER") {
      router.replace("/users")
    }
  }, [currentUser?.role, router])

  if (isLoading || currentUser?.role === "USER") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  return <ProfileSettingsPanel />
}
