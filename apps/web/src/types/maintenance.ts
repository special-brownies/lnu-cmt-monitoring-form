import type { EquipmentRecord } from "@/types/equipment"

export type MaintenanceStatus = "UNDER_MAINTENANCE" | "MAINTENANCE_COMPLETED"

export type MaintenanceRecord = {
  id: string
  equipmentId: number
  scheduledDate: string
  technician?: string | null
  notes?: string | null
  status: MaintenanceStatus
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  equipment: EquipmentRecord
}

export type MaintenanceFilters = {
  search?: string
  status?: MaintenanceStatus
}

export type ScheduleMaintenanceInput = {
  equipmentId: number
  scheduledDate: string
  technician?: string
  notes?: string
}
