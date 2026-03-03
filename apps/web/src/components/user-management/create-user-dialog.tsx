"use client"

import { FormEvent, useState } from "react"
import { PlusIcon } from "lucide-react"
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
import type { CreateFacultyInput, FacultyStatus } from "@/types/faculty"
import type { CreateSuperAdminInput } from "@/types/user"

type CreateUserDialogProps = {
  isCreatingUser: boolean
  isCreatingAdmin: boolean
  onCreateUser: (input: CreateFacultyInput) => Promise<void>
  onCreateAdmin: (input: CreateSuperAdminInput) => Promise<void>
}

type CreationRole = "SUPER_ADMIN" | "USER"

const defaultUserForm: CreateFacultyInput = {
  name: "",
  employeeId: "",
  password: "",
  status: "ACTIVE",
}

const defaultAdminForm: CreateSuperAdminInput = {
  name: "",
  email: "",
  password: "",
  status: "ACTIVE",
}

export function CreateUserDialog({
  isCreatingUser,
  isCreatingAdmin,
  onCreateUser,
  onCreateAdmin,
}: CreateUserDialogProps) {
  const [selectionOpen, setSelectionOpen] = useState(false)
  const [adminFormOpen, setAdminFormOpen] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<CreationRole | null>(null)
  const [userForm, setUserForm] = useState<CreateFacultyInput>(defaultUserForm)
  const [adminForm, setAdminForm] = useState<CreateSuperAdminInput>(defaultAdminForm)

  const handleUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await onCreateUser(userForm)
      setUserForm(defaultUserForm)
      setUserFormOpen(false)
    } catch {
      // Keep dialog open when request fails so user can retry.
    }
  }

  const handleAdminSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await onCreateAdmin(adminForm)
      setAdminForm(defaultAdminForm)
      setAdminFormOpen(false)
    } catch {
      // Keep dialog open when request fails so user can retry.
    }
  }

  const handleRoleProceed = () => {
    if (!selectedRole) {
      return
    }

    setSelectionOpen(false)

    if (selectedRole === "SUPER_ADMIN") {
      setAdminFormOpen(true)
      return
    }

    setUserFormOpen(true)
  }

  return (
    <>
      <Dialog
        open={selectionOpen}
        onOpenChange={(nextOpen) => {
          setSelectionOpen(nextOpen)
          if (!nextOpen) {
            setSelectedRole(null)
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <PlusIcon className="size-4" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Creating User For:</DialogTitle>
            <DialogDescription>Select one account type before continuing.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 hover:border-slate-300">
              <input
                type="radio"
                name="create-user-role"
                value="SUPER_ADMIN"
                checked={selectedRole === "SUPER_ADMIN"}
                onChange={() => setSelectedRole("SUPER_ADMIN")}
                className="h-4 w-4 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-800">Admin</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 hover:border-slate-300">
              <input
                type="radio"
                name="create-user-role"
                value="USER"
                checked={selectedRole === "USER"}
                onChange={() => setSelectedRole("USER")}
                className="h-4 w-4 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-800">User</span>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectionOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleRoleProceed} disabled={!selectedRole}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminFormOpen} onOpenChange={setAdminFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin</DialogTitle>
            <DialogDescription>Add a new super admin account for system access.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleAdminSubmit}>
            <div className="space-y-1">
              <label htmlFor="create-admin-name" className="text-sm font-medium text-slate-700">
                Name
              </label>
              <Input
                id="create-admin-name"
                autoFocus
                value={adminForm.name}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Juan Dela Cruz"
                required
                minLength={2}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="create-admin-email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                id="create-admin-email"
                type="email"
                value={adminForm.email}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="admin@lnu.local"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="create-admin-password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="create-admin-password"
                type="password"
                value={adminForm.password}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="create-admin-status" className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="create-admin-status"
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                value={adminForm.status}
                onChange={(event) =>
                  setAdminForm((current) => ({
                    ...current,
                    status: event.target.value as FacultyStatus,
                  }))
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdminFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingAdmin}>
                {isCreatingAdmin ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Add a new faculty account for system access.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUserSubmit}>
            <div className="space-y-1">
              <label htmlFor="create-name" className="text-sm font-medium text-slate-700">
                Name
              </label>
              <Input
                id="create-name"
                autoFocus
                value={userForm.name}
                onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Juan Dela Cruz"
                required
                minLength={2}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="create-employee-id" className="text-sm font-medium text-slate-700">
                Employee ID
              </label>
              <Input
                id="create-employee-id"
                value={userForm.employeeId}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, employeeId: event.target.value.toUpperCase() }))
                }
                placeholder="FAC-1001"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="create-password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="create-password"
                type="password"
                value={userForm.password}
                onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="create-status" className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="create-status"
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
                value={userForm.status}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    status: event.target.value as FacultyStatus,
                  }))
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingUser}>
                {isCreatingUser ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
