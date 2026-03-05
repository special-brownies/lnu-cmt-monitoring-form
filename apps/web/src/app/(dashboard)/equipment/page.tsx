"use client"

import { FormEvent, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ClockIcon, PencilIcon, PlusIcon, Trash2Icon, WrenchIcon } from "lucide-react"
import { EquipmentTimelineDialog } from "@/components/equipment/equipment-timeline-dialog"
import { ScheduleMaintenanceDialog } from "@/components/maintenance/schedule-maintenance-dialog"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { notifyError, notifySuccess } from "@/lib/activity-toast"
import { getCategories } from "@/lib/api/categories"
import {
  createEquipment,
  deleteEquipment,
  getEquipmentList,
  updateEquipment,
} from "@/lib/api/equipment"
import { getFacultyList } from "@/lib/api/faculty"
import { getRooms } from "@/lib/api/rooms"
import { getFacultyStatus } from "@/types/faculty"
import type {
  CreateEquipmentInput,
  EquipmentRecord,
  EquipmentStatus,
  UpdateEquipmentInput,
} from "@/types/equipment"
import type { RoomRecord } from "@/types/room"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ActionIcon } from "@/components/ui/action-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SortSelect } from "@/components/ui/sort-select"
import { sortCollection, type SortOption } from "@/lib/sort"

type StatusFilterValue = "ALL" | EquipmentStatus

type EquipmentFormState = {
  name: string
  serialNumber: string
  categoryId: string
  customCategoryName: string
  facultyId: string
  status: EquipmentStatus
  roomId: string
}

const REQUIRED_STATUSES: EquipmentStatus[] = [
  "ASSIGNED",
  "AVAILABLE",
  "DEFECTIVE",
]

const defaultAddForm: EquipmentFormState = {
  name: "",
  serialNumber: "",
  categoryId: "",
  customCategoryName: "",
  facultyId: "",
  status: "AVAILABLE",
  roomId: "",
}

function normalizeEquipmentStatus(status?: string | null): EquipmentStatus {
  const normalizedStatus = status?.trim().toUpperCase() ?? ""

  if (normalizedStatus === "ASSIGNED") {
    return "ASSIGNED"
  }

  if (normalizedStatus === "ACTIVE") {
    return "ASSIGNED"
  }

  if (normalizedStatus === "MAINTENANCE") {
    return "MAINTENANCE"
  }

  if (normalizedStatus === "DEFECTIVE") {
    return "DEFECTIVE"
  }

  if (normalizedStatus === "AVAILABLE") {
    return "AVAILABLE"
  }

  return "AVAILABLE"
}

function formatStatusLabel(status: EquipmentStatus) {
  if (status === "ASSIGNED") return "Active"
  if (status === "AVAILABLE") return "Available"
  if (status === "MAINTENANCE") return "Maintenance"
  return "Defective"
}

function statusBadgeClass(status: EquipmentStatus) {
  if (status === "ASSIGNED") {
    return "border-indigo-200 bg-indigo-100 text-indigo-700"
  }

  if (status === "AVAILABLE") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700"
  }

  if (status === "MAINTENANCE") {
    return "border-amber-200 bg-amber-100 text-amber-700"
  }

  return "border-rose-200 bg-rose-100 text-rose-700"
}

function formatDateOnly(value: string | Date) {
  const date = new Date(value)
  return date.toISOString().slice(0, 10)
}

function normalizeFormValues(form: EquipmentFormState) {
  return {
    name: form.name.trim(),
    serialNumber: form.serialNumber.trim(),
    categoryId: form.categoryId,
    customCategoryName: form.customCategoryName.trim(),
    facultyId: form.facultyId,
    status: form.status,
    roomId: form.roomId,
  }
}

function mapEquipmentToForm(equipment: EquipmentRecord): EquipmentFormState {
  return {
    name: equipment.name,
    serialNumber: equipment.serialNumber,
    categoryId: String(equipment.categoryId),
    customCategoryName: equipment.customCategoryName ?? "",
    facultyId: equipment.facultyId,
    status: normalizeEquipmentStatus(equipment.currentStatus?.status),
    roomId: equipment.currentRoom ? String(equipment.currentRoom.id) : "",
  }
}

export default function EquipmentPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.role === "SUPER_ADMIN"

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(
    (searchParams.get("status") as StatusFilterValue) || "ALL",
  )
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "ALL")
  const [sort, setSort] = useState<SortOption>("NEWEST")

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<EquipmentFormState>(defaultAddForm)
  const [addError, setAddError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentRecord | null>(null)
  const [editForm, setEditForm] = useState<EquipmentFormState>(defaultAddForm)
  const [initialEditForm, setInitialEditForm] = useState<EquipmentFormState>(defaultAddForm)
  const [editError, setEditError] = useState<string | null>(null)

  const [timelineEquipment, setTimelineEquipment] = useState<EquipmentRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EquipmentRecord | null>(null)
  const [scheduleFromEditOpen, setScheduleFromEditOpen] = useState(false)

  const categoryQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })

  const roomQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  })

  const facultyQuery = useQuery({
    queryKey: ["faculty"],
    queryFn: getFacultyList,
    enabled: isAdmin,
  })

  const equipmentQuery = useQuery({
    queryKey: ["equipment", search, statusFilter, categoryFilter],
    queryFn: () =>
      getEquipmentList({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        categoryId: categoryFilter === "ALL" ? undefined : Number.parseInt(categoryFilter, 10),
      }),
  })

  const categories = categoryQuery.data ?? []
  const rooms = roomQuery.data ?? []
  const faculties = facultyQuery.data ?? []
  const activeFaculties = useMemo(
    () => faculties.filter((faculty) => getFacultyStatus(faculty) === "ACTIVE"),
    [faculties],
  )
  const equipmentList = equipmentQuery.data ?? []

  const otherCategory = useMemo(
    () => categories.find((category) => category.name.trim().toLowerCase() === "other") ?? null,
    [categories],
  )

  const statusOptions = useMemo(() => {
    const values = new Set<EquipmentStatus>(REQUIRED_STATUSES)
    for (const equipment of equipmentList) {
      values.add(normalizeEquipmentStatus(equipment.currentStatus?.status))
    }
    return Array.from(values)
  }, [equipmentList])

  const sortedEquipmentList = useMemo(() => {
    return sortCollection(equipmentList, sort, {
      getPrimaryText: (equipment) => equipment.name,
      getDateValue: (equipment) => equipment.currentStatus?.changedAt ?? equipment.createdAt,
    })
  }, [equipmentList, sort])

  const hasEditChanges = useMemo(() => {
    return JSON.stringify(normalizeFormValues(editForm)) !== JSON.stringify(normalizeFormValues(initialEditForm))
  }, [editForm, initialEditForm])
  const canScheduleSelectedEquipment = useMemo(() => {
    if (!selectedEquipment) {
      return false
    }

    const status = normalizeEquipmentStatus(selectedEquipment.currentStatus?.status)
    return status === "ASSIGNED" || status === "AVAILABLE"
  }, [selectedEquipment])

  const otherCategoryId = otherCategory ? String(otherCategory.id) : null
  const isAddOtherSelected =
    otherCategoryId !== null && addForm.categoryId === otherCategoryId
  const isEditOtherSelected =
    otherCategoryId !== null && editForm.categoryId === otherCategoryId

  const openAddDialog = () => {
    setAddForm((current) => ({
      ...current,
      categoryId: current.categoryId || (categories[0] ? String(categories[0].id) : ""),
      facultyId: current.facultyId || (activeFaculties[0]?.id ?? ""),
    }))
    setAddOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["equipment"] })
      await queryClient.invalidateQueries({ queryKey: ["equipmentStats"] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] })
      setAddOpen(false)
      setAddError(null)
      setAddForm(defaultAddForm)
    },
    onError: (error) => {
      setAddError(error instanceof Error ? error.message : "Unable to create equipment")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateEquipment,
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: ["equipment"] })
      await queryClient.invalidateQueries({ queryKey: ["equipmentStats"] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] })
      await queryClient.invalidateQueries({ queryKey: ["equipment", "timeline", payload.id] })
      const statusChanged = payload.previousStatus !== payload.status
      if (!statusChanged) {
        notifySuccess("Equipment details updated.")
      }
      setEditOpen(false)
      setEditError(null)
      setSelectedEquipment(null)
    },
    onError: (error) => {
      setEditError(error instanceof Error ? error.message : "Unable to update equipment")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["equipment"] })
      await queryClient.invalidateQueries({ queryKey: ["equipmentStats"] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] })
      notifySuccess("Equipment deleted.")
      setDeleteTarget(null)
    },
    onError: (error) => {
      notifyError(
        error instanceof Error ? error.message : "Unable to delete equipment",
      )
    },
  })

  const updateQueryParams = (
    nextSearch: string,
    nextStatus: StatusFilterValue,
    nextCategory: string,
  ) => {
    const params = new URLSearchParams()

    if (nextSearch.trim().length > 0) {
      params.set("search", nextSearch.trim())
    }

    if (nextStatus !== "ALL") {
      params.set("status", nextStatus)
    }

    if (nextCategory !== "ALL") {
      params.set("category", nextCategory)
    }

    const queryString = params.toString()
    router.replace(queryString.length > 0 ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    updateQueryParams(value, statusFilter, categoryFilter)
  }

  const handleStatusFilterChange = (value: StatusFilterValue) => {
    setStatusFilter(value)
    updateQueryParams(search, value, categoryFilter)
  }

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value)
    updateQueryParams(search, statusFilter, value)
  }

  const handleCreateEquipment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddError(null)

    const categoryId = Number.parseInt(addForm.categoryId, 10)
    const roomId = addForm.roomId.length > 0 ? Number.parseInt(addForm.roomId, 10) : undefined
    const customCategoryName = addForm.customCategoryName.trim()

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setAddError("Please select a valid category.")
      return
    }

    if (roomId !== undefined && (!Number.isInteger(roomId) || roomId <= 0)) {
      setAddError("Please select a valid room.")
      return
    }

    if (isAddOtherSelected && customCategoryName.length < 2) {
      setAddError("Please specify a custom category name for Other.")
      return
    }

    const payload: CreateEquipmentInput = {
      name: addForm.name.trim(),
      serialNumber: addForm.serialNumber.trim(),
      categoryId,
      customCategoryName: isAddOtherSelected ? customCategoryName : undefined,
      facultyId: addForm.facultyId,
      status: addForm.status,
      roomId,
    }

    try {
      await createMutation.mutateAsync(payload)
    } catch {
      // Handled in mutation callbacks.
    }
  }

  const openEditDialog = (equipment: EquipmentRecord) => {
    const formValues = mapEquipmentToForm(equipment)
    setSelectedEquipment(equipment)
    setEditForm(formValues)
    setInitialEditForm(formValues)
    setEditError(null)
    setEditOpen(true)
  }

  const handleEditSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEditError(null)

    if (!selectedEquipment) {
      return
    }

    const categoryId = Number.parseInt(editForm.categoryId, 10)
    const roomId = editForm.roomId.length > 0 ? Number.parseInt(editForm.roomId, 10) : undefined
    const customCategoryName = editForm.customCategoryName.trim()

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setEditError("Please select a valid category.")
      return
    }

    if (roomId !== undefined && (!Number.isInteger(roomId) || roomId <= 0)) {
      setEditError("Please select a valid room.")
      return
    }

    if (isEditOtherSelected && customCategoryName.length < 2) {
      setEditError("Please specify a custom category name for Other.")
      return
    }

    const facultyName = activeFaculties.find((faculty) => faculty.id === editForm.facultyId)?.name
    const payload: UpdateEquipmentInput = {
      id: selectedEquipment.id,
      name: editForm.name.trim(),
      serialNumber: editForm.serialNumber.trim(),
      categoryId,
      customCategoryName: isEditOtherSelected ? customCategoryName : undefined,
      facultyId: editForm.facultyId,
      status: editForm.status,
      roomId,
      previousStatus: normalizeEquipmentStatus(selectedEquipment.currentStatus?.status),
      previousRoomId: selectedEquipment.currentRoom?.id,
      previousFacultyId: selectedEquipment.facultyId,
      facultyName,
    }

    try {
      await updateMutation.mutateAsync(payload)
    } catch {
      // Handled in mutation callbacks.
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Equipment Management</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[320px] flex-1">
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search by name or serial number..."
                aria-label="Search equipment"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => handleStatusFilterChange(event.target.value as StatusFilterValue)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
              aria-label="Filter equipment by status"
            >
              <option value="ALL">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatStatusLabel(status)}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => handleCategoryFilterChange(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
              aria-label="Filter equipment by category"
            >
              <option value="ALL">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>

            <SortSelect
              value={sort}
              onChange={setSort}
              ariaLabel="Sort equipment"
              className="h-10 min-w-[110px]"
            />

            {isAdmin && (
              <Button onClick={openAddDialog}>
                <PlusIcon className="size-4" />
                Add Equipment
              </Button>
            )}
          </div>

          {equipmentQuery.isError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Unable to load equipment. Please try again.
            </div>
          )}

          {equipmentQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedEquipmentList.length === 0 ? (
            <EmptyState
              title="No equipment found"
              description="Try adjusting filters or create a new equipment record."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Equipment Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Serial Number</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Assigned Faculty</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Room</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Updated</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody
                  key={sort}
                  className="divide-y divide-slate-100 bg-white transition-all duration-200 ease-out"
                >
                  {sortedEquipmentList.map((equipment) => {
                    const status = normalizeEquipmentStatus(equipment.currentStatus?.status)
                    const lastUpdatedValue =
                      equipment.currentStatus?.changedAt ?? equipment.createdAt
                    const categoryLabel =
                      equipment.category?.name?.trim().toLowerCase() === "other" &&
                      equipment.customCategoryName
                        ? `Other (${equipment.customCategoryName})`
                        : equipment.category?.name ?? "-"

                    return (
                      <tr key={equipment.id}>
                        <td className="px-4 py-3 text-slate-800">{equipment.name}</td>
                        <td className="px-4 py-3 text-slate-700">{equipment.serialNumber}</td>
                        <td className="px-4 py-3 text-slate-700">{categoryLabel}</td>
                        <td className="px-4 py-3 text-slate-700">{equipment.faculty?.name ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{equipment.currentRoom?.name ?? "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusBadgeClass(status)}>
                            {formatStatusLabel(status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatDateOnly(lastUpdatedValue)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {isAdmin && (
                              <ActionIcon
                                icon={PencilIcon}
                                label="Edit equipment"
                                onClick={() => openEditDialog(equipment)}
                              />
                            )}
                            <ActionIcon
                              icon={ClockIcon}
                              label="View timeline"
                              onClick={() => {
                                setTimelineEquipment(equipment)
                              }}
                            />
                            {isAdmin && (
                              <ActionIcon
                                icon={Trash2Icon}
                                label="Delete equipment"
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => setDeleteTarget(equipment)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            openAddDialog()
            return
          }

          setAddOpen(nextOpen)
          if (!nextOpen) {
            setAddForm(defaultAddForm)
            setAddError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>Create a new equipment record.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateEquipment}>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="add-equipment-name">
                  Equipment Name
                </label>
                <Input
                  id="add-equipment-name"
                  value={addForm.name}
                  onChange={(event) => setAddForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="add-category">
                  Category
                </label>
                <select
                  id="add-category"
                  value={addForm.categoryId}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, categoryId: event.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`space-y-1 overflow-hidden transition-all duration-200 ${
                  isAddOtherSelected
                    ? "max-h-24 opacity-100"
                    : "pointer-events-none max-h-0 opacity-0"
                }`}
              >
                <label className="text-sm font-medium text-slate-700" htmlFor="add-custom-category">
                  Specify Category
                </label>
                <Input
                  id="add-custom-category"
                  value={addForm.customCategoryName}
                  onChange={(event) =>
                    setAddForm((current) => ({
                      ...current,
                      customCategoryName: event.target.value,
                    }))
                  }
                  placeholder="e.g. Scanner"
                  required={isAddOtherSelected}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="add-faculty">
                  Faculty
                </label>
                <select
                  id="add-faculty"
                  value={addForm.facultyId}
                  onChange={(event) => setAddForm((current) => ({ ...current, facultyId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                  required
                >
                  <option value="" disabled>
                    Select faculty
                  </option>
                  {activeFaculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} ({faculty.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="add-serial-number">
                  Serial Number
                </label>
                <Input
                  id="add-serial-number"
                  value={addForm.serialNumber}
                  onChange={(event) =>
                    setAddForm((current) => ({ ...current, serialNumber: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="add-status">
                  Status
                </label>
                <select
                  id="add-status"
                  value={addForm.status}
                  onChange={(event) =>
                    setAddForm((current) => ({
                      ...current,
                      status: event.target.value as EquipmentStatus,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                  required
                >
                  {REQUIRED_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="add-room">
                  Room
                </label>
                <select
                  id="add-room"
                  value={addForm.roomId}
                  onChange={(event) => setAddForm((current) => ({ ...current, roomId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                >
                  <option value="">Unassigned</option>
                  {rooms.map((room: RoomRecord) => (
                    <option key={room.id} value={String(room.id)}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {addError && (
              <p className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {addError}
              </p>
            )}

            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Equipment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen)
          if (!nextOpen) {
            setSelectedEquipment(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update equipment details.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleEditSave}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-equipment-name">
                Equipment Name
              </label>
              <Input
                id="edit-equipment-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-serial-number">
                Serial Number
              </label>
              <Input
                id="edit-serial-number"
                value={editForm.serialNumber}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    serialNumber: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-category">
                Category
              </label>
              <select
                id="edit-category"
                value={editForm.categoryId}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, categoryId: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-status">
                Status
              </label>
              <select
                id="edit-status"
                value={editForm.status}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    status: event.target.value as EquipmentStatus,
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                required
              >
                {REQUIRED_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`space-y-1 overflow-hidden transition-all duration-200 md:col-span-2 ${
                isEditOtherSelected
                  ? "max-h-24 opacity-100"
                  : "pointer-events-none max-h-0 opacity-0"
              }`}
            >
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-custom-category">
                Specify Category
              </label>
              <Input
                id="edit-custom-category"
                value={editForm.customCategoryName}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    customCategoryName: event.target.value,
                  }))
                }
                placeholder="e.g. Scanner"
                required={isEditOtherSelected}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-faculty">
                Faculty
              </label>
              <select
                id="edit-faculty"
                value={editForm.facultyId}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, facultyId: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                required
              >
                <option value="" disabled>
                  Select faculty
                </option>
                {activeFaculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name} ({faculty.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-room">
                Room
              </label>
              <select
                id="edit-room"
                value={editForm.roomId}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, roomId: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
              >
                <option value="">Unassigned</option>
                {rooms.map((room: RoomRecord) => (
                  <option key={room.id} value={String(room.id)}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {editError && (
              <p className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {editError}
              </p>
            )}

            <DialogFooter className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={!selectedEquipment || !canScheduleSelectedEquipment}
                onClick={() => setScheduleFromEditOpen(true)}
              >
                <WrenchIcon className="size-4" />
                Schedule Maintenance
              </Button>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ScheduleMaintenanceDialog
        open={scheduleFromEditOpen}
        onOpenChange={setScheduleFromEditOpen}
        preselectedEquipment={selectedEquipment}
        lockEquipment
        title="Schedule Maintenance"
        description="Create a maintenance task for this equipment."
        onScheduled={() => {
          setScheduleFromEditOpen(false)
          setEditOpen(false)
          setSelectedEquipment(null)
        }}
      />

      <EquipmentTimelineDialog
        open={timelineEquipment !== null}
        equipmentId={timelineEquipment?.id}
        equipmentName={timelineEquipment?.name}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setTimelineEquipment(null)
          }
        }}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteTarget(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Equipment</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`
                : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending || !deleteTarget}
              onClick={async () => {
                if (!deleteTarget) {
                  return
                }

                try {
                  await deleteMutation.mutateAsync(deleteTarget.id)
                } catch {
                  // handled by mutation callbacks
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
