"use client"

import { useEffect, useMemo, useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UsersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateUserDialog } from "@/components/user-management/create-user-dialog"
import { DeleteUserDialog } from "@/components/user-management/delete-user-dialog"
import { EditUserDialog } from "@/components/user-management/edit-user-dialog"
import { ResetPasswordDialog } from "@/components/user-management/reset-password-dialog"
import { ApiError } from "@/lib/api/client"
import {
  createFaculty,
  deleteFaculty,
  getFacultyList,
  resetFacultyPassword,
  updateFaculty,
} from "@/lib/api/faculty"
import type {
  CreateFacultyInput,
  FacultyRecord,
  FacultyStatus,
  UpdateFacultyInput,
} from "@/types/faculty"
import { getFacultyStatus } from "@/types/faculty"

type StatusFilter = "ALL" | FacultyStatus

type ToastState = {
  type: "success" | "error"
  message: string
} | null

function statusBadgeClass(status: FacultyStatus) {
  if (status === "INACTIVE") {
    return "border-rose-200 bg-rose-100 text-rose-700"
  }

  return "border-emerald-200 bg-emerald-100 text-emerald-700"
}

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [toast, setToast] = useState<ToastState>(null)
  const queryClient = useQueryClient()

  const facultyQuery = useQuery({
    queryKey: ["faculty"],
    queryFn: getFacultyList,
  })

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeout = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const createMutation = useMutation({
    mutationFn: createFaculty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty"] })
      setToast({ type: "success", message: "User created" })
    },
    onError: (error) => {
      setToast({
        type: "error",
        message:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : "Failed to create user",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateFaculty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty"] })
      setToast({ type: "success", message: "User updated" })
    },
    onError: (error) => {
      setToast({
        type: "error",
        message:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : "Failed to update user",
      })
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetFacultyPassword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty"] })
      setToast({ type: "success", message: "Password reset" })
    },
    onError: (error) => {
      setToast({
        type: "error",
        message:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : "Failed to reset password",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFaculty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty"] })
      setToast({ type: "success", message: "User deleted" })
    },
    onError: (error) => {
      setToast({
        type: "error",
        message:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : "Failed to delete user",
      })
    },
  })

  const faculties = facultyQuery.data ?? []

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return faculties.filter((faculty) => {
      const facultyStatus = getFacultyStatus(faculty)
      const matchesSearch =
        normalizedSearch.length === 0 ||
        faculty.name.toLowerCase().includes(normalizedSearch) ||
        faculty.employeeId.toLowerCase().includes(normalizedSearch)
      const matchesStatus =
        statusFilter === "ALL" || facultyStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [faculties, search, statusFilter])

  const columns = useMemo<ColumnDef<FacultyRecord>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "employeeId",
        header: "Employee ID",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = getFacultyStatus(row.original)
          return (
            <Badge variant="outline" className={statusBadgeClass(status)}>
              {status === "ACTIVE" ? "Active" : "Inactive"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) =>
          new Date(row.original.updatedAt).toLocaleString(),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const faculty = row.original
          const status = getFacultyStatus(faculty)

          return (
            <div className="flex flex-wrap items-center gap-2">
              <EditUserDialog
                faculty={faculty}
                status={status}
                isSubmitting={updateMutation.isPending}
                onUpdate={async (input: UpdateFacultyInput) => {
                  await updateMutation.mutateAsync(input)
                }}
              />
              <ResetPasswordDialog
                faculty={faculty}
                isSubmitting={resetMutation.isPending}
                onResetPassword={async (id, password) => {
                  await resetMutation.mutateAsync({ id, password })
                }}
              />
              <DeleteUserDialog
                faculty={faculty}
                isSubmitting={deleteMutation.isPending}
                onDelete={async (id) => {
                  await deleteMutation.mutateAsync(id)
                }}
              />
            </div>
          )
        },
      },
    ],
    [deleteMutation, resetMutation, updateMutation],
  )

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">User Management</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[320px]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or employee ID..."
                aria-label="Search users"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 font-sans"
                aria-label="Filter users by status"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <CreateUserDialog
                isSubmitting={createMutation.isPending}
                onCreate={async (input: CreateFacultyInput) => {
                  await createMutation.mutateAsync(input)
                }}
              />
            </div>
          </div>

          {facultyQuery.isError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Unable to load users. Please try again.
            </div>
          )}

          {facultyQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <UsersIcon className="mb-3 size-8 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">No users found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting filters or create a new user
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left font-semibold text-slate-700"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-slate-700">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
