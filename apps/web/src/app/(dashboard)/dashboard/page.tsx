"use client"

import { type ComponentType, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ActivityIcon,
  KeyRoundIcon,
  PackageIcon,
  PlusCircleIcon,
  ShieldUserIcon,
  WrenchIcon,
} from "lucide-react"
import {
  CardAction,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/dashboard/empty-state"
import { PasswordRequestsDialog } from "@/components/dashboard/password-requests-dialog"
import { RecentActivityDialog } from "@/components/dashboard/recent-activity-dialog"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import {
  getDashboardStats,
  getEquipmentSummary,
  getRecentActivities,
} from "@/lib/api/dashboard"
import { getUserRole } from "@/lib/auth"
import type { DashboardStats } from "@/types/dashboard"

type StatCardProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  valueSelector: (stats: DashboardStats) => number
}

function StatCard({ icon: Icon, label, valueSelector }: StatCardProps) {
  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
    select: valueSelector,
  })

  return (
    <Card className="border-slate-200 transition-transform duration-200 hover:scale-[1.02] hover:shadow-md">
      <CardHeader className="items-center pb-0 text-center">
        <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-10 w-10" />
        </div>
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {statsQuery.isLoading ? (
          <Skeleton className="mx-auto h-10 w-20" />
        ) : statsQuery.isError ? (
          <div className="space-y-2 text-center">
            <p className="text-sm text-slate-500">Unable to load</p>
            <Button size="sm" variant="outline" onClick={() => void statsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <p className="text-center text-3xl font-bold text-slate-900">{statsQuery.data ?? 0}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)

  const activitiesQuery = useQuery({
    queryKey: ["activities", "recent"],
    queryFn: getRecentActivities,
  })

  useQuery({
    queryKey: ["equipment", "summary"],
    queryFn: getEquipmentSummary,
  })

  const { data: currentUser } = useCurrentUser()
  const role = currentUser?.role ?? getUserRole()
  const isSuperAdmin = role === "SUPER_ADMIN"

  const sortedActivities = useMemo(() => {
    const records = activitiesQuery.data ?? []
    return [...records].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    )
  }, [activitiesQuery.data])

  const showDevelopingToast = (path: string, message: string) => {
    setToast(message)
    window.setTimeout(() => {
      router.push(path)
      setToast(null)
    }, 350)
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Welcome to LNU CMT Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 md:text-base">Monitor and manage your IT assets</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Equipment"
          icon={PackageIcon}
          valueSelector={(stats) => stats.totalEquipment}
        />
        <StatCard
          label="Active Equipment"
          icon={ActivityIcon}
          valueSelector={(stats) => stats.activeEquipment}
        />
        <StatCard
          label="Under Maintenance"
          icon={WrenchIcon}
          valueSelector={(stats) => stats.maintenanceCount}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest actions from monitoring workflows</CardDescription>
            <CardAction>
              <RecentActivityDialog
                activities={sortedActivities}
                isLoading={activitiesQuery.isLoading}
                isError={activitiesQuery.isError}
                onRetry={() => {
                  void activitiesQuery.refetch()
                }}
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            {activitiesQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : activitiesQuery.isError ? (
              <div className="space-y-4">
                <EmptyState
                  title="Unable to load activities"
                  description="There was an issue fetching recent activity."
                />
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => void activitiesQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : sortedActivities.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Recent equipment status and location updates will appear here."
              />
            ) : (
              <div className="space-y-3">
                {sortedActivities.slice(0, 6).map((activity) => (
                  <div
                    key={activity.id}
                    className="relative rounded-lg border border-slate-200 bg-white p-3 pl-9 transition-colors hover:bg-slate-50"
                  >
                    <ActivityIcon className="absolute top-3 left-3 size-4 text-slate-400" />
                    <p className="text-sm text-slate-700">{activity.description}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
              onClick={() =>
                showDevelopingToast(
                  "/equipment",
                  "Equipment Management is still being developed",
                )
              }
            >
              <PlusCircleIcon className="size-4" />
              Add Equipment
            </Button>

            {isSuperAdmin && (
              <Button
                variant="outline"
                className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
                onClick={() =>
                  showDevelopingToast(
                    "/users",
                    "User Management is still being developed",
                  )
                }
              >
                <ShieldUserIcon className="size-4" />
                Create User
              </Button>
            )}

            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
              onClick={() =>
                showDevelopingToast(
                  "/equipment",
                  "Maintenance workflow is still being developed",
                )
              }
            >
              <WrenchIcon className="size-4" />
              Schedule Maintenance
            </Button>

            {isSuperAdmin && (
              <PasswordRequestsDialog
                trigger={
                  <Button
                    variant="outline"
                    className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
                  >
                    <KeyRoundIcon className="size-4" />
                    Password Requests
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
