"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2Icon, ClockIcon, FileTextIcon, PlusIcon } from "lucide-react"
import AuthGuard from "@/components/auth/AuthGuard"
import { EmptyState } from "@/components/dashboard/empty-state"
import { EquipmentTimelineDialog } from "@/components/equipment/equipment-timeline-dialog"
import { ScheduleMaintenanceDialog } from "@/components/maintenance/schedule-maintenance-dialog"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { ActionIcon } from "@/components/ui/action-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SortSelect } from "@/components/ui/sort-select"
import {
  completeMaintenance,
  getMaintenanceRecords,
} from "@/lib/api/maintenance"
import { sortCollection, type SortOption } from "@/lib/sort"
import type { EquipmentRecord } from "@/types/equipment"
import type {
  MaintenanceRecord,
  MaintenanceStatus,
} from "@/types/maintenance"

type MaintenanceFilter = "ALL" | MaintenanceStatus

function formatDateOnly(value?: string | Date | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  return date.toISOString().slice(0, 10)
}

function statusBadgeClass(status: MaintenanceStatus) {
  if (status === "UNDER_MAINTENANCE") {
    return "border-amber-200 bg-amber-100 text-amber-700"
  }

  return "border-emerald-200 bg-emerald-100 text-emerald-700"
}

function statusLabel(status: MaintenanceStatus) {
  if (status === "UNDER_MAINTENANCE") {
    return "Under Maintenance"
  }

  return "Maintenance Completed"
}

export default function MaintenancePage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN", "USER"]}>
      <MaintenanceManagementContent />
    </AuthGuard>
  )
}

function MaintenanceManagementContent() {
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.role === "SUPER_ADMIN"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<MaintenanceFilter>("ALL")
  const [sort, setSort] = useState<SortOption>("NEWEST")
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [selectedTimelineEquipment, setSelectedTimelineEquipment] = useState<EquipmentRecord | null>(null)
  const [selectedNoteRecord, setSelectedNoteRecord] = useState<MaintenanceRecord | null>(null)

  const maintenanceQuery = useQuery({
    queryKey: ["maintenance", search, statusFilter],
    queryFn: () =>
      getMaintenanceRecords({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
  })

  const completeMutation = useMutation({
    mutationFn: completeMaintenance,
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      await queryClient.invalidateQueries({ queryKey: ["equipment"] })
      await queryClient.invalidateQueries({ queryKey: ["equipmentStats"] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] })
      await queryClient.invalidateQueries({ queryKey: ["activities", "recent"] })
      await queryClient.invalidateQueries({
        queryKey: ["equipment", "timeline", record.equipmentId],
      })
    },
  })

  const sortedMaintenanceRecords = useMemo(() => {
    const maintenanceRecords = maintenanceQuery.data ?? []
    return sortCollection(maintenanceRecords, sort, {
      getPrimaryText: (record) => record.equipment.name,
      getDateValue: (record) => record.scheduledDate,
    })
  }, [maintenanceQuery.data, sort])

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">
            {isAdmin ? "Maintenance Management" : "Maintenance Requests"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[320px] flex-1">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by equipment name or serial number..."
                aria-label="Search maintenance records"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as MaintenanceFilter)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
              aria-label="Filter maintenance status"
            >
              <option value="ALL">All</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="MAINTENANCE_COMPLETED">Maintenance Completed</option>
            </select>

            <SortSelect
              value={sort}
              onChange={setSort}
              ariaLabel="Sort maintenance records"
              className="h-10 min-w-[110px]"
            />

            <Button onClick={() => setScheduleOpen(true)}>
              <PlusIcon className="size-4" />
              {isAdmin ? "Schedule Maintenance" : "Request Maintenance"}
            </Button>
          </div>

          {maintenanceQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : maintenanceQuery.isError ? (
            <div className="space-y-4">
              <EmptyState
                title="Unable to load maintenance records"
                description="There was an issue fetching maintenance data."
              />
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => void maintenanceQuery.refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : sortedMaintenanceRecords.length === 0 ? (
            <EmptyState
              title="No maintenance records"
              description="Schedule maintenance to create your first maintenance entry."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Equipment Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Serial Number</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Assigned Faculty</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Room</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Scheduled Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Updated</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody
                  key={sort}
                  className="divide-y divide-slate-100 bg-white transition-all duration-200 ease-out"
                >
                  {sortedMaintenanceRecords.map((record) => {
                    const equipment = record.equipment
                    const categoryLabel =
                      equipment.category?.name?.trim().toLowerCase() === "other" &&
                      equipment.customCategoryName
                        ? `Other (${equipment.customCategoryName})`
                        : equipment.category?.name ?? "-"
                    const lastUpdated = record.completedAt ?? record.updatedAt

                    return (
                      <tr key={record.id}>
                        <td className="px-4 py-3 text-slate-800">{equipment.name}</td>
                        <td className="px-4 py-3 text-slate-700">{equipment.serialNumber}</td>
                        <td className="px-4 py-3 text-slate-700">{categoryLabel}</td>
                        <td className="px-4 py-3 text-slate-700">{equipment.faculty?.name ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{equipment.currentRoom?.name ?? "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusBadgeClass(record.status)}>
                            {statusLabel(record.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatDateOnly(record.scheduledDate)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateOnly(lastUpdated)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <ActionIcon
                              icon={ClockIcon}
                              label="View timeline"
                              onClick={() => setSelectedTimelineEquipment(equipment)}
                            />
                            <ActionIcon
                              icon={FileTextIcon}
                              label="View maintenance note"
                              onClick={() => setSelectedNoteRecord(record)}
                            />
                            {isAdmin && (
                              <ActionIcon
                                icon={CheckCircle2Icon}
                                label="Mark maintenance as completed"
                                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                disabled={
                                  completeMutation.isPending ||
                                  record.status !== "UNDER_MAINTENANCE"
                                }
                                onClick={async () => {
                                  if (record.status !== "UNDER_MAINTENANCE") {
                                    return
                                  }

                                  try {
                                    await completeMutation.mutateAsync(record.id)
                                  } catch {
                                    // handled by mutation state
                                  }
                                }}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleMaintenanceDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        title={isAdmin ? "Schedule Maintenance" : "Request Maintenance"}
        description={
          isAdmin
            ? "Select equipment and schedule a maintenance task."
            : "Submit a maintenance request for equipment assigned to you."
        }
        submitLabel={isAdmin ? "Schedule Maintenance" : "Submit Request"}
        pendingLabel={isAdmin ? "Scheduling..." : "Submitting..."}
        scheduledDateLabel={isAdmin ? "Scheduled Date" : "Requested Date"}
        showTechnicianField={isAdmin}
      />

      <EquipmentTimelineDialog
        open={selectedTimelineEquipment !== null}
        equipmentId={selectedTimelineEquipment?.id}
        equipmentName={selectedTimelineEquipment?.name}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedTimelineEquipment(null)
          }
        }}
      />

      <Dialog
        open={selectedNoteRecord !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedNoteRecord(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Maintenance Note</DialogTitle>
            <DialogDescription>
              Review maintenance schedule details and notes.
            </DialogDescription>
          </DialogHeader>

          {selectedNoteRecord && (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Equipment Name
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedNoteRecord.equipment.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Serial Number
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedNoteRecord.equipment.serialNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Scheduled Date
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(selectedNoteRecord.scheduledDate).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Scheduled By
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedNoteRecord.scheduledBy?.name ?? "System"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Maintenance Note
                </p>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
                    {selectedNoteRecord.notes?.trim().length
                      ? selectedNoteRecord.notes
                      : "No maintenance note was provided for this task."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedNoteRecord(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
