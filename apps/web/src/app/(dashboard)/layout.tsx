import { ReactNode } from "react"
import AuthGuard from "@/components/auth/AuthGuard"
import DashboardLayoutShell from "@/components/layout/dashboard-layout"

type DashboardLayoutProps = {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <DashboardLayoutShell>{children}</DashboardLayoutShell>
    </AuthGuard>
  )
}
