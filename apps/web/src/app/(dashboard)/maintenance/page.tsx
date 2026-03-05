"use client"

import { FormEvent, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2Icon, ClockIcon, PlusIcon, WrenchIcon } from "lucide-react"
import AuthGuard from "@/components/auth/AuthGuard"
import { EmptyState } from "@/components/dashboard/empty-state"
import { EquipmentTimelineDialog } from "@/components/equipment/equipment-timeline-dialog"
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
import { getEquipmentList } from "@/lib/api/equipment"
import {
  completeMaintenance,
  getMaintenanceRecords,
  scheduleMaintenance,
} from "@/lib/api/maintenance"
import { sortCollection, type SortOption } from "@/lib/sort"
import type { EquipmentRecord } from "@/types/equipment"
import type {
  MaintenanceStatus,
  ScheduleMaintenanceInput,
} from "@/types/maintenance"

type MaintenanceFilter = "ALL" | MaintenanceStatus

type ScheduleFormState = {
  equipmentId: string
  technician: string
  notes: string
  scheduledDate: string
}

const defaultScheduleForm: ScheduleFormState = {
  equipmentId: "",
  technician: "",
  notes: "",
  scheduledDate: "",
}

function formatDateOnly(value?: string | Date | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  return date.toISOString().slice(0, 10)
}

function normalizeEquipmentStatus(status?: string | null) {
  const normalized = status?.trim().toUpperCase() ?? ""

  if (normalized === "ACTIVE") {
    return "ASSIGNED"
  }

  return normalized
}

function isMaintenanceCandidate(equipment: EquipmentRecord) {
  const status = normalizeEquipmentStatus(equipment.currentStatus?.status)
  return status === "AVAILABLE" || status === "ASSIGNED"
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
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <MaintenanceManagementContent />
    </AuthGuard>
  )
}

function MaintenanceManagementContent() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<MaintenanceFilter>("ALL")
  const [sort, setSort] = useState<SortOption>("NEWEST")
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [selectedTimelineEquipment, setSelectedTimelineEquipment] = useState<EquipmentRecord | null>(null)
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(defaultScheduleForm)

  const maintenanceQuery = useQuery({
    queryKey: ["maintenance", search, statusFilter],
    queryFn: () =>
      getMaintenanceRecords({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
  })

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "schedule-candidates"],
    queryFn: () => getEquipmentList(),
  })

  const scheduleMutation = useMutation({
    mutationFn: scheduleMaintenance,
    onSuccess: async (_, payload) => {
      setScheduleOpen(false)
      setScheduleForm(defaultScheduleForm)
      setScheduleError(null)
      await queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      await queryClient.invalidateQueries({ queryKey: ["equipment"] })
      await queryClient.invalidateQueries({ queryKey: ["equipmentStats"] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] })
      await queryClient.invalidateQueries({ queryKey: ["activities", "recent"] })
      await queryClient.invalidateQueries({
        queryKey: ["equipment", "timeline", payload.equipmentId],
      })
    },
    onError: (error) => {
      setScheduleError(
        error instanceof Error ? error.message : "Unable to schedule maintenance",
      )
    },
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

  const scheduleCandidates = useMemo(() => {
    const equipments = equipmentQuery.data ?? []
    return sortCollection(
      equipments.filter(isMaintenanceCandidate),
      "AZ",
      {
        getPrimaryText: (equipment) => equipment.name,
        getDateValue: (equipment) => equipment.createdAt,
      },
    )
  }, [equipmentQuery.data])

  const selectedEquipment = useMemo(() => {
    if (!scheduleForm.equipmentId) {
      return null
    }

    const equipmentId = Number.parseInt(scheduleForm.equipmentId, 10)
    if (!Number.isInteger(equipmentId)) {
      return null
    }

    return (
      scheduleCandidates.find((equipment) => equipment.id === equipmentId) ?? null
    )
  }, [scheduleCandidates, scheduleForm.equipmentId])

  const handleScheduleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setScheduleError(null)

    const equipmentId = Number.parseInt(scheduleForm.equipmentId, 10)

    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      setScheduleError("Please select equipment.")
      return
    }

    if (!scheduleForm.scheduledDate) {
      setScheduleError("Please select a scheduled date.")
      return
    }

    const payload: ScheduleMaintenanceInput = {
      equipmentId,
      scheduledDate: new Date(scheduleForm.scheduledDate).toISOString(),
      technician: scheduleForm.technician.trim() || undefined,
      notes: scheduleForm.notes.trim() || undefined,
    }

    try {
      await scheduleMutation.mutateAsync(payload)
    } catch {
      // handled in mutation callback
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Maintenance Management</CardTitle>
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
              Schedule Maintenance
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

      <Dialog
        open={scheduleOpen}
        onOpenChange={(nextOpen) => {
          setScheduleOpen(nextOpen)

          if (!nextOpen) {
            setScheduleError(null)
            setScheduleForm(defaultScheduleForm)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WrenchIcon className="h-4 w-4" />
              Schedule Maintenance
            </DialogTitle>
            <DialogDescription>
              Select equipment and schedule a maintenance task.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleScheduleSubmit}>
            <div className="space-y-1">
              <label htmlFor="maintenance-equipment" className="text-sm font-medium text-slate-700">
                Equipment
              </label>
              <select
                id="maintenance-equipment"
                value={scheduleForm.equipmentId}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    equipmentId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                required
              >
                <option value="" disabled>
                  Select equipment
                </option>
                {scheduleCandidates.map((equipment) => (
                  <option key={equipment.id} value={String(equipment.id)}>
                    {equipment.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="maintenance-serial" className="text-sm font-medium text-slate-700">
                Serial Number
              </label>
              <Input
                id="maintenance-serial"
                value={selectedEquipment?.serialNumber ?? ""}
                placeholder="Auto-populated"
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="maintenance-technician" className="text-sm font-medium text-slate-700">
                Assigned Technician / Staff (Optional)
              </label>
              <Input
                id="maintenance-technician"
                value={scheduleForm.technician}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    technician: event.target.value,
                  }))
                }
                placeholder="e.g. John Dela Cruz"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="maintenance-notes" className="text-sm font-medium text-slate-700">
                Maintenance Notes
              </label>
              <textarea
                id="maintenance-notes"
                value={scheduleForm.notes}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                placeholder="Enter maintenance details"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="maintenance-date" className="text-sm font-medium text-slate-700">
                Scheduled Date
              </label>
              <Input
                id="maintenance-date"
                type="datetime-local"
                value={scheduleForm.scheduledDate}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    scheduledDate: event.target.value,
                  }))
                }
                required
              />
            </div>

            {scheduleError && (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {scheduleError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending ? "Scheduling..." : "Schedule Maintenance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
