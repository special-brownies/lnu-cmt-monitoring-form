"use client"

import { FormEvent, ReactElement, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PencilIcon } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ActionIcon } from "@/components/ui/action-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { createRoom, getRooms, updateRoom } from "@/lib/api/rooms"
import type { CreateRoomInput, RoomRecord, UpdateRoomInput } from "@/types/room"

type RoomManagerDialogProps = {
  trigger: ReactElement
}

type CreateRoomContext = {
  previousRooms: RoomRecord[]
}

type RoomFormState = {
  name: string
  building: string
  floorNumber: string
}

const defaultForm: RoomFormState = {
  name: "",
  building: "",
  floorNumber: "",
}

export function RoomManagerDialog({ trigger }: RoomManagerDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [localError, setLocalError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<RoomFormState>(defaultForm)
  const [initialEditValues, setInitialEditValues] = useState<RoomFormState>(defaultForm)
  const [editError, setEditError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
    enabled: open,
  })

  const rooms = roomsQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: createRoom,
    onMutate: async (payload): Promise<CreateRoomContext> => {
      await queryClient.cancelQueries({ queryKey: ["rooms"] })
      const previousRooms = queryClient.getQueryData<RoomRecord[]>(["rooms"]) ?? []

      const optimisticRoom: RoomRecord = {
        id: -Date.now(),
        name: payload.name,
        building: payload.building || null,
        floor: payload.floor || null,
      }

      queryClient.setQueryData<RoomRecord[]>(["rooms"], [...previousRooms, optimisticRoom])
      return { previousRooms }
    },
    onError: (error, _payload, context) => {
      if (context?.previousRooms) {
        queryClient.setQueryData(["rooms"], context.previousRooms)
      }

      setLocalError(error instanceof Error ? error.message : "Unable to create room")
    },
    onSuccess: () => {
      setLocalError(null)
      setForm(defaultForm)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateRoom,
    onMutate: async (payload): Promise<CreateRoomContext> => {
      await queryClient.cancelQueries({ queryKey: ["rooms"] })
      const previousRooms = queryClient.getQueryData<RoomRecord[]>(["rooms"]) ?? []

      queryClient.setQueryData<RoomRecord[]>(
        ["rooms"],
        previousRooms.map((room) =>
          room.id === payload.id
            ? {
                ...room,
                name: payload.name,
                building: payload.building || null,
                floor: payload.floor || null,
              }
            : room,
        ),
      )

      return { previousRooms }
    },
    onError: (error, _payload, context) => {
      if (context?.previousRooms) {
        queryClient.setQueryData(["rooms"], context.previousRooms)
      }

      setEditError(error instanceof Error ? error.message : "Unable to update room")
    },
    onSuccess: () => {
      setEditError(null)
      setEditOpen(false)
      setEditingRoomId(null)
      setEditForm(defaultForm)
      setInitialEditValues(defaultForm)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] })
    },
  })

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((first, second) => first.id - second.id)
  }, [rooms])

  const normalizedEditValues = useMemo(
    () => ({
      name: editForm.name.trim(),
      building: editForm.building.trim(),
      floorNumber: editForm.floorNumber.trim(),
    }),
    [editForm],
  )

  const normalizedInitialEditValues = useMemo(
    () => ({
      name: initialEditValues.name.trim(),
      building: initialEditValues.building.trim(),
      floorNumber: initialEditValues.floorNumber.trim(),
    }),
    [initialEditValues],
  )

  const hasEditChanges = useMemo(() => {
    return JSON.stringify(normalizedEditValues) !== JSON.stringify(normalizedInitialEditValues)
  }, [normalizedEditValues, normalizedInitialEditValues])

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    const floorNumber = Number.parseInt(form.floorNumber, 10)

    if (!Number.isInteger(floorNumber) || floorNumber < 0) {
      setLocalError("Floor Number must be a non-negative integer.")
      return
    }

    const payload: CreateRoomInput = {
      name: form.name.trim(),
      building: form.building.trim(),
      floor: String(floorNumber),
    }

    try {
      await createMutation.mutateAsync(payload)
    } catch {
      // Error state is handled in mutation callbacks.
    }
  }

  const openEditDialog = (room: RoomRecord) => {
    const roomValues = {
      name: room.name,
      building: room.building ?? "",
      floorNumber: room.floor ?? "",
    }

    setEditingRoomId(room.id)
    setEditForm(roomValues)
    setInitialEditValues(roomValues)
    setEditError(null)
    setEditOpen(true)
  }

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEditError(null)

    if (editingRoomId === null) {
      return
    }

    const floorNumber = Number.parseInt(editForm.floorNumber, 10)

    if (!Number.isInteger(floorNumber) || floorNumber < 0) {
      setEditError("Floor Number must be a non-negative integer.")
      return
    }

    const payload: UpdateRoomInput = {
      id: editingRoomId,
      name: editForm.name.trim(),
      building: editForm.building.trim(),
      floor: String(floorNumber),
    }

    try {
      await updateMutation.mutateAsync(payload)
    } catch {
      // Error state is handled in mutation callbacks.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setForm(defaultForm)
          setLocalError(null)
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Room Manager</DialogTitle>
          <DialogDescription>
            View all rooms and create new room records.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-4" onSubmit={handleCreateRoom}>
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="room-name" className="text-sm font-medium text-slate-700">
              Room Name
            </label>
            <Input
              id="room-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="ComLab 4"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="room-building" className="text-sm font-medium text-slate-700">
              Building
            </label>
            <Input
              id="room-building"
              value={form.building}
              onChange={(event) =>
                setForm((current) => ({ ...current, building: event.target.value }))
              }
              placeholder="Main"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="room-floor-number" className="text-sm font-medium text-slate-700">
              Floor Number
            </label>
            <Input
              id="room-floor-number"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={form.floorNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, floorNumber: event.target.value }))
              }
              placeholder="2"
              required
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Room"}
            </Button>
          </div>
        </form>

        {localError && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {localError}
          </p>
        )}

        {roomsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : roomsQuery.isError ? (
          <div className="space-y-4">
            <EmptyState
              title="Unable to load rooms"
              description="There was an issue fetching room records."
            />
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void roomsQuery.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : sortedRooms.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No rooms yet
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Room Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Building</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Floor Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedRooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-4 py-3 text-slate-800">{room.name}</td>
                    <td className="px-4 py-3 text-slate-700">{room.building || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{room.floor || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ActionIcon
                          icon={PencilIcon}
                          label={`Edit room ${room.name}`}
                          onClick={() => openEditDialog(room)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>

      <Dialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen)
          if (!nextOpen) {
            setEditingRoomId(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room details and save your changes.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSaveEdit}>
            <div className="space-y-1">
              <label htmlFor="edit-room-name" className="text-sm font-medium text-slate-700">
                Room Name
              </label>
              <Input
                id="edit-room-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-room-building" className="text-sm font-medium text-slate-700">
                Building
              </label>
              <Input
                id="edit-room-building"
                value={editForm.building}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, building: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-room-floor-number" className="text-sm font-medium text-slate-700">
                Floor Number
              </label>
              <Input
                id="edit-room-floor-number"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={editForm.floorNumber}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, floorNumber: event.target.value }))
                }
                required
              />
            </div>

            {editError && (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {editError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!hasEditChanges || updateMutation.isPending}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
