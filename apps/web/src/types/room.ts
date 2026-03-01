export type RoomRecord = {
  id: number
  name: string
  building: string | null
  floor: string | null
}

export type CreateRoomInput = {
  name: string
  building: string
  floor: string
}

export type UpdateRoomInput = {
  id: number
  name: string
  building: string
  floor: string
}
