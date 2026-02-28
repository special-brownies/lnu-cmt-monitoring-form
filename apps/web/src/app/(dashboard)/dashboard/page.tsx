"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ActivityIcon,
  Clock3Icon,
  PlusCircleIcon,
  ShieldUserIcon,
  WrenchIcon,
  LaptopIcon,
  CircleGaugeIcon,
  TriangleAlertIcon,
  KeyRoundIcon,
} from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getUserRole } from "@/lib/auth"

type ActivityStatus =
  | "Active"
  | "Maintenance"
  | "Inactive"
  | "Assigned"
  | "Available"
  | "Defective"

type ActivityItem = {
  id: string
  title: string
  detail: string
  status: ActivityStatus
  date: string
}

type EquipmentItem = {
  id: string
  name: string
  status: "Active" | "Assigned" | "Available"
}

const mockActivities: ActivityItem[] = [
  {
    id: "ACT-1006",
    title: "Maintenance completed",
    detail: "HP EliteDesk in Lab 2 returned to Active status",
    status: "Active",
    date: "2026-03-01T10:20:00.000Z",
  },
  {
    id: "ACT-1005",
    title: "Equipment moved",
    detail: "Dell OptiPlex reassigned to Room IT-202",
    status: "Assigned",
    date: "2026-03-01T08:45:00.000Z",
  },
  {
    id: "ACT-1004",
    title: "Defect flagged",
    detail: "Projector PJ-07 reported with lens issue",
    status: "Defective",
    date: "2026-02-28T13:15:00.000Z",
  },
  {
    id: "ACT-1003",
    title: "Availability update",
    detail: "Spare switch inventory marked Available",
    status: "Available",
    date: "2026-02-27T09:05:00.000Z",
  },
  {
    id: "ACT-1002",
    title: "Maintenance scheduled",
    detail: "Workstation WS-11 queued for diagnostics",
    status: "Maintenance",
    date: "2026-02-25T15:40:00.000Z",
  },
]

const mockEquipment: EquipmentItem[] = [
  { id: "EQ-001", name: "Dell OptiPlex 7070", status: "Active" },
  { id: "EQ-002", name: "Lenovo ThinkCentre M70", status: "Assigned" },
  { id: "EQ-003", name: "HP EliteDesk 800", status: "Available" },
  { id: "EQ-004", name: "Cisco SG350", status: "Available" },
]

const mockPasswordRequests = [
  {
    id: "REQ-001",
    employeeId: "FAC-1001",
    name: "Dr. Santos",
    requestedAt: "2026-03-01T09:32:00.000Z",
    status: "PENDING",
  },
  {
    id: "REQ-002",
    employeeId: "FAC-1020",
    name: "Prof. Rivera",
    requestedAt: "2026-02-28T16:08:00.000Z",
    status: "PENDING",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<"SUPER_ADMIN" | "USER" | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [activityDateFilter, setActivityDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [maintenanceFilter, setMaintenanceFilter] = useState<"All" | "Active" | "Assigned" | "Available">("All")
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900)
    setRole(getUserRole())

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const sortedActivities = useMemo(() => {
    return [...mockActivities].sort(
      (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
    )
  }, [])

  const filteredActivities = useMemo(() => {
    const now = Date.now()

    return sortedActivities.filter((activity) => {
      const date = new Date(activity.date).getTime()

      if (activityDateFilter === "today") {
        const twentyFourHours = 24 * 60 * 60 * 1000
        return now - date <= twentyFourHours
      }

      if (activityDateFilter === "week") {
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        return now - date <= sevenDays
      }

      if (activityDateFilter === "month") {
        const thirtyDays = 30 * 24 * 60 * 60 * 1000
        return now - date <= thirtyDays
      }

      return true
    })
  }, [activityDateFilter, sortedActivities])

  const maintenanceCandidates = useMemo(() => {
    if (maintenanceFilter === "All") {
      return mockEquipment
    }

    return mockEquipment.filter((equipment) => equipment.status === maintenanceFilter)
  }, [maintenanceFilter])

  const stats = [
    {
      label: "Total Equipment",
      value: "128",
      icon: LaptopIcon,
    },
    {
      label: "Active Equipment",
      value: "97",
      icon: CircleGaugeIcon,
    },
    {
      label: "Under Maintenance",
      value: "14",
      icon: WrenchIcon,
    },
  ]

  const showDevelopingToast = (path: string, message: string) => {
    setToast(message)
    window.setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const handleMaintenanceConfirm = () => {
    if (!selectedEquipmentId) {
      setToast("Please select equipment before confirming")
      return
    }

    setToast("Maintenance scheduled (mock action)")
    setMaintenanceDialogOpen(false)
    setSelectedEquipmentId("")
    setMaintenanceFilter("All")
  }

  if (loading) {
    return <DashboardSkeleton />
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
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card
              key={stat.label}
              className="border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="items-center pb-2 text-center">
                <div className="mb-2 inline-flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-sm font-medium text-slate-600">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-3xl font-bold text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest actions from monitoring workflows</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" onClick={() => setActivityDialogOpen(true)}>
                View All
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedActivities.slice(0, 4).map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                    <StatusBadge status={activity.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{activity.detail}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(activity.date).toLocaleString()}</p>
                </div>
              ))}
            </div>
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

            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
              onClick={() =>
                showDevelopingToast(
                  "/users",
                  "Equipment Management is still being developed",
                )
              }
            >
              <ShieldUserIcon className="size-4" />
              Create User
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
              onClick={() => setMaintenanceDialogOpen(true)}
            >
              <WrenchIcon className="size-4" />
              Schedule Maintenance
            </Button>

            {role === "SUPER_ADMIN" && (
              <Button
                variant="outline"
                className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
                onClick={() => setPasswordDialogOpen(true)}
              >
                <KeyRoundIcon className="size-4" />
                Password Requests
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Timeline</DialogTitle>
            <DialogDescription>Newest activities appear first.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock3Icon className="size-4 text-slate-500" />
              <select
                value={activityDateFilter}
                onChange={(event) =>
                  setActivityDateFilter(event.target.value as "all" | "today" | "week" | "month")
                }
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="all">All Dates</option>
                <option value="today">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {filteredActivities.length === 0 ? (
              <EmptyState
                title="No activities found"
                description="Try adjusting your date filter to see more results."
              />
            ) : (
              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="relative rounded-lg border border-slate-200 bg-white p-3 pl-9">
                    <ActivityIcon className="absolute top-3 left-3 size-4 text-slate-400" />
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">{activity.title}</h3>
                      <StatusBadge status={activity.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{activity.detail}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(activity.date).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>
              Select equipment and set a mock maintenance action.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TriangleAlertIcon className="size-4 text-slate-500" />
              <select
                value={maintenanceFilter}
                onChange={(event) =>
                  setMaintenanceFilter(
                    event.target.value as "All" | "Active" | "Assigned" | "Available",
                  )
                }
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Assigned">Assigned</option>
                <option value="Available">Available</option>
              </select>
            </div>

            {maintenanceCandidates.length === 0 ? (
              <EmptyState
                title="No equipment available"
                description="No matching equipment found for the selected status."
              />
            ) : (
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {maintenanceCandidates.map((equipment) => (
                  <label
                    key={equipment.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{equipment.name}</p>
                      <p className="text-xs text-slate-500">{equipment.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={equipment.status} />
                      <input
                        type="radio"
                        name="maintenance-equipment"
                        value={equipment.id}
                        checked={selectedEquipmentId === equipment.id}
                        onChange={(event) => setSelectedEquipmentId(event.target.value)}
                        className="size-4"
                      />
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMaintenanceConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Password Requests</DialogTitle>
            <DialogDescription>Pending requests requiring SUPER_ADMIN review.</DialogDescription>
          </DialogHeader>

          {mockPasswordRequests.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="All faculty password requests are already resolved."
            />
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {mockPasswordRequests.map((request) => (
                <div key={request.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{request.name}</p>
                    <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Employee ID: {request.employeeId}</p>
                  <p className="text-xs text-slate-400">Requested: {new Date(request.requestedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  )
}
