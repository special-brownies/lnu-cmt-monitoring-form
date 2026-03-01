export interface DashboardStats {
  totalEquipment: number
  activeEquipment: number
  maintenanceCount: number
}

export interface Activity {
  id: string
  description: string
  createdAt: string
}

export interface EquipmentSummary {
  totalEquipment: number
  activeEquipment: number
  maintenanceCount: number
  defectiveCount: number
  assignedCount: number
  availableCount: number
  uncategorizedCount: number
}
