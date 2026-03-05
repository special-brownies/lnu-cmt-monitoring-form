"use client"

import { useMemo } from "react"
import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BoxesIcon,
  ClipboardListIcon,
  DoorOpenIcon,
  ShieldCheckIcon,
  UsersRoundIcon,
  WrenchIcon,
} from "lucide-react"
import AuthGuard from "@/components/auth/AuthGuard"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardAnalytics } from "@/lib/api/dashboard"
import type { AnalyticsDistributionItem, AnalyticsStatusItem } from "@/types/dashboard"

type OverviewCardProps = {
  label: string
  value: number
  icon: ComponentType<{ className?: string }>
  iconToneClass: string
}

type CountRow = {
  id: string
  label: string
  value: number
  toneClass: string
}

function OverviewCard({ label, value, icon: Icon, iconToneClass }: OverviewCardProps) {
  return (
    <Card className="border-slate-200">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconToneClass}`}>
          <Icon className="h-6 w-6" />
        </span>
      </CardContent>
    </Card>
  )
}

function DistributionRows({
  rows,
  emptyLabel,
}: {
  rows: Array<{ label: string; count: number }>
  emptyLabel: string
}) {
  const maxCount = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.count), 0),
    [rows],
  )

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const width = maxCount === 0 ? 0 : Math.max(6, Math.round((row.count / maxCount) * 100))

        return (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-700">{row.label}</span>
              <span className="text-sm font-semibold text-slate-900">{row.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-400 transition-[width] duration-300"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActivityInsightRows({ rows }: { rows: CountRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">{row.label}</p>
          <p className={`mt-1 text-2xl font-bold ${row.toneClass}`}>{row.value}</p>
        </div>
      ))}
    </div>
  )
}

function AnalyticsContent() {
  const analyticsQuery = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: getDashboardAnalytics,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })

  const categoryRows = useMemo(
    () =>
      (analyticsQuery.data?.equipmentDistribution ?? []).map((item: AnalyticsDistributionItem) => ({
        label: item.category,
        count: item.count,
      })),
    [analyticsQuery.data?.equipmentDistribution],
  )

  const statusRows = useMemo(
    () =>
      (analyticsQuery.data?.statusDistribution ?? []).map((item: AnalyticsStatusItem) => ({
        label: item.status,
        count: item.count,
      })),
    [analyticsQuery.data?.statusDistribution],
  )

  const activityRows = useMemo<CountRow[]>(() => {
    const insights = analyticsQuery.data?.activityInsights

    if (!insights) {
      return []
    }

    return [
      {
        id: "maintenance-scheduled",
        label: "Maintenance tasks scheduled",
        value: insights.totalMaintenanceScheduled,
        toneClass: "text-sky-700",
      },
      {
        id: "maintenance-completed",
        label: "Maintenance tasks completed",
        value: insights.totalMaintenanceCompleted,
        toneClass: "text-emerald-700",
      },
      {
        id: "status-changes",
        label: "Equipment status changes",
        value: insights.totalEquipmentStatusChanges,
        toneClass: "text-amber-700",
      },
      {
        id: "password-requests",
        label: "Password requests submitted",
        value: insights.totalPasswordRequestsSubmitted,
        toneClass: "text-violet-700",
      },
    ]
  }, [analyticsQuery.data?.activityInsights])

  if (analyticsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (analyticsQuery.isError || !analyticsQuery.data) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-10">
          <EmptyState
            title="Unable to load analytics"
            description="There was an issue fetching analytics data from the server."
          />
        </CardContent>
      </Card>
    )
  }

  const { overview, updatedAt } = analyticsQuery.data

  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Live system insights based on equipment, users, maintenance, and requests.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <OverviewCard
          label="Total Equipment"
          value={overview.totalEquipment}
          icon={BoxesIcon}
          iconToneClass="bg-slate-100 text-slate-700"
        />
        <OverviewCard
          label="Active Equipment"
          value={overview.activeEquipment}
          icon={ActivityIcon}
          iconToneClass="bg-emerald-100 text-emerald-700"
        />
        <OverviewCard
          label="Under Maintenance"
          value={overview.equipmentUnderMaintenance}
          icon={WrenchIcon}
          iconToneClass="bg-amber-100 text-amber-700"
        />
        <OverviewCard
          label="Defective Equipment"
          value={overview.defectiveEquipment}
          icon={AlertTriangleIcon}
          iconToneClass="bg-rose-100 text-rose-700"
        />
        <OverviewCard
          label="Total Users"
          value={overview.totalUsers}
          icon={UsersRoundIcon}
          iconToneClass="bg-sky-100 text-sky-700"
        />
        <OverviewCard
          label="Total Rooms"
          value={overview.totalRooms}
          icon={DoorOpenIcon}
          iconToneClass="bg-indigo-100 text-indigo-700"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardListIcon className="size-5 text-slate-600" />
              Equipment Distribution
            </CardTitle>
            <CardDescription>Equipment count by category</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionRows rows={categoryRows} emptyLabel="No category data available." />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheckIcon className="size-5 text-slate-600" />
              Status Distribution
            </CardTitle>
            <CardDescription>Latest equipment status totals</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionRows rows={statusRows} emptyLabel="No status data available." />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Activity Insights</CardTitle>
            <CardDescription>
              Last updated {new Date(updatedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityInsightRows rows={activityRows} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <AnalyticsContent />
    </AuthGuard>
  )
}
