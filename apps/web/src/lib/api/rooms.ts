import { apiClient } from "@/lib/api/client"
import type { CreateRoomInput, RoomRecord, UpdateRoomInput } from "@/types/room"

export function getRooms() {
  return apiClient<RoomRecord[]>("/rooms", { cache: "no-store" })
}

export function createRoom(input: CreateRoomInput) {
  return apiClient<RoomRecord>("/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })
}

export function updateRoom(input: UpdateRoomInput) {
  return apiClient<RoomRecord>(`/rooms/${input.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      building: input.building,
      floor: input.floor,
    }),
  })
}
