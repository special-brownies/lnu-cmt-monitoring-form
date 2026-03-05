"use client"

import { useMemo, useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UsersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SortSelect } from "@/components/ui/sort-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateUserDialog } from "@/components/user-management/create-user-dialog"
import { DeleteAdminDialog } from "@/components/user-management/delete-admin-dialog"
import { DeleteUserDialog } from "@/components/user-management/delete-user-dialog"
import { EditAdminDialog } from "@/components/user-management/edit-admin-dialog"
import { EditUserDialog } from "@/components/user-management/edit-user-dialog"
import { ResetPasswordDialog } from "@/components/user-management/reset-password-dialog"
import { ApiError } from "@/lib/api/client"
import {
  notifyError,
  notifySuccess,
} from "@/lib/activity-toast"
import {
  createFaculty,
  deleteFaculty,
  getFacultyList,
  resetFacultyPassword,
  updateFaculty,
} from "@/lib/api/faculty"
import {
  createSuperAdmin,
  deleteSuperAdmin,
  getSuperAdminList,
  updateSuperAdmin,
} from "@/lib/api/user"
import { sortCollection, type SortOption } from "@/lib/sort"
import type {
  CreateFacultyInput,
  FacultyRecord,
  FacultyStatus,
  UpdateFacultyInput,
} from "@/types/faculty"
import { getFacultyStatus } from "@/types/faculty"
import type {
  CreateSuperAdminInput,
  SuperAdminRecord,
  UpdateSuperAdminInput,
} from "@/types/user"

type StatusFilter = "ALL" | FacultyStatus
type RoleFilter = "ALL" | "USER" | "ADMIN"

type UserManagementRow = {
  id: string
  role: "USER" | "ADMIN"
  name: string
  identifier: string
  status: FacultyStatus
  updatedAt: string
  faculty: FacultyRecord | null
  admin: SuperAdminRecord | null
}

function statusBadgeClass(status: FacultyStatus) {
  if (status === "INACTIVE") {
    return "border-rose-200 bg-rose-100 text-rose-700"
  }

  return "border-emerald-200 bg-emerald-100 text-emerald-700"
}

function roleBadgeClass(role: UserManagementRow["role"]) {
  if (role === "ADMIN") {
    return "border-sky-200 bg-sky-100 text-sky-700"
  }

  return "border-slate-200 bg-slate-100 text-slate-700"
}

function toUserRow(faculty: FacultyRecord): UserManagementRow {
  return {
    id: faculty.id,
    role: "USER",
    name: faculty.name,
    identifier: faculty.employeeId,
    status: getFacultyStatus(faculty),
    updatedAt: faculty.updatedAt,
    faculty,
    admin: null,
  }
}

function getAdminStatus(admin: SuperAdminRecord): FacultyStatus {
  if (String(admin.status ?? "").toUpperCase() === "INACTIVE") {
    return "INACTIVE"
  }

  return "ACTIVE"
}

function toAdminRow(admin: SuperAdminRecord): UserManagementRow {
  return {
    id: admin.id,
    role: "ADMIN",
    name: admin.name,
    identifier: admin.email,
    status: getAdminStatus(admin),
    updatedAt: admin.updatedAt,
    faculty: null,
    admin,
  }
}

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL")
  const [sort, setSort] = useState<SortOption>("NEWEST")
  const queryClient = useQueryClient()

  const facultyQuery = useQuery({
    queryKey: ["faculty"],
    queryFn: getFacultyList,
  })

  const adminQuery = useQuery({
    queryKey: ["admins"],
    queryFn: getSuperAdminList,
  })

  const createUserMutation = useMutation({
    mutationFn: createFaculty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty"] })
    },
    onError: (error) => {
      notifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to create user",
      )
    },
  })

  const createAdminMutation = useMutation({
    mutationFn: createSuperAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admins"] })
    },
    onError: (error) => {
      notifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to create admin",
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateFaculty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty"] })
    },
    onError: (error) => {
      notifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to update user",
      )
    },
  })

  const updateAdminMutation = useMutation({
    mutationFn: updateSuperAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admins"] })
    },
    onError: (error) => {
      notifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to update admin",
      )
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetFacultyPassword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty"] })
      notifySuccess("Password reset successfully.")
    },
    onError: (error) => {
      notifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to reset password",
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFaculty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty"] })
      notifySuccess("User deleted.")
    },
    onError: (error) => {
      notifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to delete user",
      )
    },
  })

  const deleteAdminMutation = useMutation({
    mutationFn: deleteSuperAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admins"] })
      notifySuccess("Admin deleted.")
    },
    onError: (error) => {
      notifyError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to delete admin",
      )
    },
  })

  const userRows = useMemo(() => {
    const faculties = facultyQuery.data ?? []
    return faculties.map(toUserRow)
  }, [facultyQuery.data])

  const adminRows = useMemo(() => {
    const admins = adminQuery.data ?? []
    return admins.map(toAdminRow)
  }, [adminQuery.data])

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const allRows: UserManagementRow[] = [...userRows, ...adminRows]
    const filtered = allRows.filter((row) => {
      const matchesRole = roleFilter === "ALL" || row.role === roleFilter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        row.name.toLowerCase().includes(normalizedSearch) ||
        row.identifier.toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        statusFilter === "ALL" || row.status === statusFilter

      return matchesRole && matchesSearch && matchesStatus
    })

    return sortCollection(filtered, sort, {
      getPrimaryText: (row) => row.name,
      getDateValue: (row) => row.updatedAt,
    })
  }, [adminRows, roleFilter, search, sort, statusFilter, userRows])

  const columns = useMemo<ColumnDef<UserManagementRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "identifier",
        header: "Employee ID / Email",
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline" className={roleBadgeClass(row.original.role)}>
            {row.original.role === "ADMIN" ? "Admin" : "User"}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className={statusBadgeClass(row.original.status)}>
            {row.original.status === "ACTIVE" ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString(),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const faculty = row.original.faculty
          const admin = row.original.admin

          if (admin) {
            const adminStatus = getAdminStatus(admin)

            return (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <EditAdminDialog
                  admin={admin}
                  status={adminStatus}
                  isSubmitting={updateAdminMutation.isPending}
                  onUpdate={async (input: UpdateSuperAdminInput) => {
                    await updateAdminMutation.mutateAsync(input)
                  }}
                />
                <DeleteAdminDialog
                  admin={admin}
                  isSubmitting={deleteAdminMutation.isPending}
                  onDelete={async (id) => {
                    await deleteAdminMutation.mutateAsync(id)
                  }}
                />
              </div>
            )
          }

          if (!faculty) {
            return null
          }

          const status = getFacultyStatus(faculty)

          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
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
    [
      deleteAdminMutation,
      deleteMutation,
      resetMutation,
      updateAdminMutation,
      updateMutation,
    ],
  )

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const isLoading = facultyQuery.isLoading || adminQuery.isLoading
  const isError = facultyQuery.isError || adminQuery.isError

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">User Management</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-[320px] space-y-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, employee ID, or email..."
                aria-label="Search users"
              />

              <Tabs
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as RoleFilter)}
                className="w-fit"
              >
                <TabsList className="bg-muted rounded-lg p-1">
                  <TabsTrigger
                    value="ALL"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="USER"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    User
                  </TabsTrigger>
                  <TabsTrigger
                    value="ADMIN"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Admin
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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

              <SortSelect
                value={sort}
                onChange={setSort}
                ariaLabel="Sort users"
                className="min-w-[110px]"
              />

              <CreateUserDialog
                isCreatingUser={createUserMutation.isPending}
                isCreatingAdmin={createAdminMutation.isPending}
                onCreateUser={async (input: CreateFacultyInput) => {
                  await createUserMutation.mutateAsync(input)
                }}
                onCreateAdmin={async (input: CreateSuperAdminInput) => {
                  await createAdminMutation.mutateAsync(input)
                }}
              />
            </div>
          </div>

          {isError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Unable to load users. Please try again.
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <UsersIcon className="mb-3 size-8 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">No users found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting filters or create a new account
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
                <tbody
                  key={sort}
                  className="divide-y divide-slate-100 bg-white transition-all duration-200 ease-out"
                >
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
