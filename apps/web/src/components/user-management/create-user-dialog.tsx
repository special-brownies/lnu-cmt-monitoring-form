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

type CreateUserDialogProps = {
  isSubmitting: boolean
  onCreate: (input: CreateFacultyInput) => Promise<void>
}

const defaultForm: CreateFacultyInput = {
  name: "",
  employeeId: "",
  password: "",
  status: "ACTIVE",
}

export function CreateUserDialog({ isSubmitting, onCreate }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateFacultyInput>(defaultForm)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await onCreate(form)
      setForm(defaultForm)
      setOpen(false)
    } catch {
      // Keep dialog open when request fails so user can retry.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>Add a new faculty account for system access.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="create-name" className="text-sm font-medium text-slate-700">
              Name
            </label>
            <Input
              id="create-name"
              autoFocus
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
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
              value={form.employeeId}
              onChange={(event) =>
                setForm((current) => ({ ...current, employeeId: event.target.value.toUpperCase() }))
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
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
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
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
