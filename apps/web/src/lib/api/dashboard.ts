import { apiClient } from '@/lib/api/client'
import type { Activity, DashboardStats, EquipmentSummary } from '@/types/dashboard'

export function getDashboardStats() {
  return apiClient<DashboardStats>('/dashboard/stats', { cache: 'no-store' })
}

export function getRecentActivities() {
  return apiClient<Activity[]>('/activities/recent', { cache: 'no-store' })
}

export function getEquipmentSummary() {
  return apiClient<EquipmentSummary>('/equipment/summary', { cache: 'no-store' })
}
