export type EquipmentStatus = "ASSIGNED" | "AVAILABLE" | "MAINTENANCE" | "DEFECTIVE"
export type TimelineRange = "24h" | "7d" | "30d"

export type EquipmentRecord = {
  id: number
  serialNumber: string
  name: string
  categoryId: number
  facultyId: string
  datePurchased: string
  createdAt: string
  category: {
    id: number
    name: string
    description?: string | null
  }
  faculty: {
    id: string
    name: string
    employeeId: string
    status?: string
  }
  currentStatus?: {
    id: number
    status: string
    changedAt: string
    notes?: string | null
  } | null
  currentRoom?: {
    id: number
    name: string
    building?: string | null
    floor?: string | null
  } | null
}

export type EquipmentTimelineEvent = {
  id: string
  type: "STATUS" | "MAINTENANCE" | "LOCATION" | "FACULTY"
  description: string
  createdAt: string
}

export type EquipmentFilters = {
  search?: string
  status?: EquipmentStatus
  categoryId?: number
}

export type CreateEquipmentInput = {
  name: string
  serialNumber: string
  categoryId: number
  facultyId: string
  status: EquipmentStatus
  roomId?: number
}

export type UpdateEquipmentInput = {
  id: number
  name: string
  serialNumber: string
  categoryId: number
  facultyId: string
  status: EquipmentStatus
  roomId?: number
  previousStatus?: EquipmentStatus
  previousRoomId?: number
  previousFacultyId?: string
  facultyName?: string
}

export type CategoryRecord = {
  id: number
  name: string
  description?: string | null
}

export type CreateCategoryInput = {
  name: string
  description?: string
}
