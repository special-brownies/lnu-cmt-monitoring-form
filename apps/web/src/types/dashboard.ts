export interface DashboardStats {
  totalEquipment: number
  activeEquipment: number
  maintenanceCount: number
}

export interface AnalyticsOverview {
  totalEquipment: number
  activeEquipment: number
  equipmentUnderMaintenance: number
  defectiveEquipment: number
  totalUsers: number
  totalRooms: number
}

export interface AnalyticsDistributionItem {
  category: string
  count: number
}

export interface AnalyticsStatusItem {
  status: string
  count: number
}

export interface AnalyticsActivityInsights {
  totalMaintenanceScheduled: number
  totalMaintenanceCompleted: number
  totalEquipmentStatusChanges: number
  totalPasswordRequestsSubmitted: number
}

export interface AnalyticsSummary {
  overview: AnalyticsOverview
  equipmentDistribution: AnalyticsDistributionItem[]
  statusDistribution: AnalyticsStatusItem[]
  activityInsights: AnalyticsActivityInsights
  updatedAt: string
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
