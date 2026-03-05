"use client"

import { FormEvent, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { WrenchIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getEquipmentList } from "@/lib/api/equipment"
import { scheduleMaintenance } from "@/lib/api/maintenance"
import type { EquipmentRecord } from "@/types/equipment"
import type { MaintenanceRecord, ScheduleMaintenanceInput } from "@/types/maintenance"

type ScheduleMaintenanceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedEquipment?: EquipmentRecord | null
  lockEquipment?: boolean
  title?: string
  description?: string
  onScheduled?: (record: MaintenanceRecord) => void
}

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

export function ScheduleMaintenanceDialog({
  open,
  onOpenChange,
  preselectedEquipment,
  lockEquipment = false,
  title = "Schedule Maintenance",
  description = "Select equipment and schedule a maintenance task.",
  onScheduled,
}: ScheduleMaintenanceDialogProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ScheduleFormState>(defaultScheduleForm)
  const [error, setError] = useState<string | null>(null)

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "schedule-candidates"],
    queryFn: () => getEquipmentList(),
    enabled: open,
  })

  const scheduleCandidates = useMemo(() => {
    const equipmentList = equipmentQuery.data ?? []
    return equipmentList.filter(isMaintenanceCandidate)
  }, [equipmentQuery.data])

  const selectedEquipment = useMemo(() => {
    if (lockEquipment && preselectedEquipment) {
      if (!equipmentQuery.data) {
        return preselectedEquipment
      }

      return (
        equipmentQuery.data.find(
          (equipment) => equipment.id === preselectedEquipment.id,
        ) ?? preselectedEquipment
      )
    }

    if (!form.equipmentId) {
      return null
    }

    const equipmentId = Number.parseInt(form.equipmentId, 10)

    if (!Number.isInteger(equipmentId)) {
      return null
    }

    return (
      scheduleCandidates.find((equipment) => equipment.id === equipmentId) ?? null
    )
  }, [
    equipmentQuery.data,
    form.equipmentId,
    lockEquipment,
    preselectedEquipment,
    scheduleCandidates,
  ])

  const scheduleMutation = useMutation({
    mutationFn: scheduleMaintenance,
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["maintenance"] })
      await queryClient.invalidateQueries({ queryKey: ["equipment"] })
      await queryClient.invalidateQueries({ queryKey: ["equipmentStats"] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] })
      await queryClient.invalidateQueries({ queryKey: ["activities", "recent"] })
      await queryClient.invalidateQueries({
        queryKey: ["equipment", "timeline", record.equipmentId],
      })
      setError(null)
      setForm(defaultScheduleForm)
      onOpenChange(false)
      onScheduled?.(record)
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to schedule maintenance",
      )
    },
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const selectedEquipmentId =
      lockEquipment && preselectedEquipment
        ? preselectedEquipment.id
        : Number.parseInt(form.equipmentId, 10)

    if (!Number.isInteger(selectedEquipmentId) || selectedEquipmentId <= 0) {
      setError("Please select equipment.")
      return
    }

    if (!form.scheduledDate) {
      setError("Please select a scheduled date.")
      return
    }

    const payload: ScheduleMaintenanceInput = {
      equipmentId: selectedEquipmentId,
      scheduledDate: new Date(form.scheduledDate).toISOString(),
      technician: form.technician.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }

    try {
      await scheduleMutation.mutateAsync(payload)
    } catch {
      // handled in mutation callbacks
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)

        if (!nextOpen) {
          setForm(defaultScheduleForm)
          setError(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WrenchIcon className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label
              htmlFor="maintenance-equipment"
              className="text-sm font-medium text-slate-700"
            >
              Equipment
            </label>
            {lockEquipment ? (
              <Input
                id="maintenance-equipment"
                value={selectedEquipment?.name ?? preselectedEquipment?.name ?? ""}
                placeholder="Auto-selected equipment"
                readOnly
              />
            ) : (
              <select
                id="maintenance-equipment"
                value={form.equipmentId}
                onChange={(event) =>
                  setForm((current) => ({
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
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="maintenance-serial"
                className="text-sm font-medium text-slate-700"
              >
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
              <label
                htmlFor="maintenance-faculty"
                className="text-sm font-medium text-slate-700"
              >
                Assigned Faculty
              </label>
              <Input
                id="maintenance-faculty"
                value={selectedEquipment?.faculty?.name ?? "Unassigned"}
                readOnly
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="maintenance-room"
              className="text-sm font-medium text-slate-700"
            >
              Room
            </label>
            <Input
              id="maintenance-room"
              value={selectedEquipment?.currentRoom?.name ?? "Unassigned"}
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="maintenance-technician"
              className="text-sm font-medium text-slate-700"
            >
              Assigned Technician / Staff (Optional)
            </label>
            <Input
              id="maintenance-technician"
              value={form.technician}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  technician: event.target.value,
                }))
              }
              placeholder="e.g. John Dela Cruz"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="maintenance-notes"
              className="text-sm font-medium text-slate-700"
            >
              Maintenance Notes
            </label>
            <textarea
              id="maintenance-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              placeholder="Enter maintenance details"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="maintenance-date"
              className="text-sm font-medium text-slate-700"
            >
              Scheduled Date
            </label>
            <Input
              id="maintenance-date"
              type="datetime-local"
              value={form.scheduledDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  scheduledDate: event.target.value,
                }))
              }
              required
            />
          </div>

          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={scheduleMutation.isPending || equipmentQuery.isLoading}
            >
              {scheduleMutation.isPending ? "Scheduling..." : "Schedule Maintenance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
