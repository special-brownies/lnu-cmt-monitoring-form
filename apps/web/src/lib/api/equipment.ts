import { apiClient } from "@/lib/api/client"
import type {
  CreateEquipmentInput,
  EquipmentFilters,
  EquipmentRecord,
  EquipmentTimelineEvent,
  TimelineRange,
  UpdateEquipmentInput,
} from "@/types/equipment"

type EquipmentPayload = {
  name: string
  serialNumber: string
  categoryId: number
  facultyId: string
  datePurchased: string
}

type CreateStatusHistoryInput = {
  equipmentId: number
  status: string
  notes?: string
}

type CreateLocationHistoryInput = {
  equipmentId: number
  roomId: number
}

function buildEquipmentPayload(
  input: Pick<CreateEquipmentInput, "name" | "serialNumber" | "categoryId" | "facultyId">,
): EquipmentPayload {
  return {
    name: input.name.trim(),
    serialNumber: input.serialNumber.trim(),
    categoryId: input.categoryId,
    facultyId: input.facultyId,
    datePurchased: new Date().toISOString(),
  }
}

function buildQueryString(filters: EquipmentFilters) {
  const params = new URLSearchParams()

  if (filters.search && filters.search.trim().length > 0) {
    params.set("search", filters.search.trim())
  }

  if (filters.status) {
    params.set("status", filters.status)
  }

  if (filters.categoryId !== undefined) {
    params.set("categoryId", String(filters.categoryId))
  }

  const queryString = params.toString()
  return queryString.length > 0 ? `?${queryString}` : ""
}

export function getEquipmentList(filters: EquipmentFilters = {}) {
  return apiClient<EquipmentRecord[]>(`/equipment${buildQueryString(filters)}`, {
    cache: "no-store",
  })
}

function createStatusHistory(payload: CreateStatusHistoryInput) {
  return apiClient("/status-history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

function createLocationHistory(payload: CreateLocationHistoryInput) {
  return apiClient("/location-history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export async function createEquipment(input: CreateEquipmentInput) {
  const equipment = await apiClient<EquipmentRecord>("/equipment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      buildEquipmentPayload({
        name: input.name,
        serialNumber: input.serialNumber,
        categoryId: input.categoryId,
        facultyId: input.facultyId,
      }),
    ),
  })

  await createStatusHistory({
    equipmentId: equipment.id,
    status: input.status,
  })

  if (input.roomId !== undefined) {
    await createLocationHistory({
      equipmentId: equipment.id,
      roomId: input.roomId,
    })
  }

  return equipment
}

export async function updateEquipment(input: UpdateEquipmentInput) {
  const equipment = await apiClient<EquipmentRecord>(`/equipment/${input.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      buildEquipmentPayload({
        name: input.name,
        serialNumber: input.serialNumber,
        categoryId: input.categoryId,
        facultyId: input.facultyId,
      }),
    ),
  })

  const statusChanged = input.previousStatus !== input.status
  const facultyChanged = input.previousFacultyId !== input.facultyId
  const roomChanged = input.previousRoomId !== input.roomId

  if (statusChanged || facultyChanged) {
    const notes = facultyChanged && input.facultyName
      ? `Faculty reassigned to ${input.facultyName}`
      : undefined

    await createStatusHistory({
      equipmentId: input.id,
      status: input.status,
      notes,
    })
  }

  if (input.roomId !== undefined && roomChanged) {
    await createLocationHistory({
      equipmentId: input.id,
      roomId: input.roomId,
    })
  }

  return equipment
}

export function deleteEquipment(id: number) {
  return apiClient(`/equipment/${id}`, {
    method: "DELETE",
  })
}

export function getEquipmentTimeline(id: number, range: TimelineRange = "24h") {
  const params = new URLSearchParams({ range })

  return apiClient<EquipmentTimelineEvent[]>(`/equipment/${id}/timeline?${params.toString()}`, {
    cache: "no-store",
  })
}
