import { ReactNode } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'

type DashboardLayoutProps = {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AuthGuard>{children}</AuthGuard>
}
