import { notifyEquipmentStatusChange } from "@/lib/activity-toast"
import { apiClient } from "@/lib/api/client"
import type {
  MaintenanceFilters,
  MaintenanceRecord,
  ScheduleMaintenanceInput,
} from "@/types/maintenance"

function buildQueryString(filters: MaintenanceFilters) {
  const params = new URLSearchParams()

  if (filters.search && filters.search.trim().length > 0) {
    params.set("search", filters.search.trim())
  }

  if (filters.status) {
    params.set("status", filters.status)
  }

  const query = params.toString()
  return query.length > 0 ? `?${query}` : ""
}

export function getMaintenanceRecords(filters: MaintenanceFilters = {}) {
  return apiClient<MaintenanceRecord[]>(`/maintenance${buildQueryString(filters)}`, {
    cache: "no-store",
  })
}

export async function scheduleMaintenance(input: ScheduleMaintenanceInput) {
  const record = await apiClient<MaintenanceRecord>("/maintenance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  notifyEquipmentStatusChange(
    "MAINTENANCE",
    record.equipment.currentStatus?.status,
    record.equipment.name,
  )

  return record
}

export async function completeMaintenance(recordId: string) {
  const record = await apiClient<MaintenanceRecord>(`/maintenance/${recordId}/complete`, {
    method: "POST",
  })

  notifyEquipmentStatusChange("AVAILABLE", "MAINTENANCE", record.equipment.name)
  return record
}
