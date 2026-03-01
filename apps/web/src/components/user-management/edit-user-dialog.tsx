"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
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
import type { FacultyRecord, FacultyStatus, UpdateFacultyInput } from "@/types/faculty"

type EditUserDialogProps = {
  faculty: FacultyRecord
  status: FacultyStatus
  isSubmitting: boolean
  onUpdate: (input: UpdateFacultyInput) => Promise<void>
}

export function EditUserDialog({
  faculty,
  status,
  isSubmitting,
  onUpdate,
}: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(faculty.name)
  const [employeeId, setEmployeeId] = useState(faculty.employeeId)
  const [nextStatus, setNextStatus] = useState<FacultyStatus>(status)
  const initialValues = useRef({
    name: faculty.name,
    employeeId: faculty.employeeId,
    status,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    setName(faculty.name)
    setEmployeeId(faculty.employeeId)
    setNextStatus(status)
    initialValues.current = {
      name: faculty.name,
      employeeId: faculty.employeeId,
      status,
    }
  }, [faculty.employeeId, faculty.name, open, status])

  const values = useMemo(
    () => ({
      name: name.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      status: nextStatus,
    }),
    [employeeId, name, nextStatus],
  )

  const hasChanges = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues.current)
  }, [values])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await onUpdate({
        id: faculty.id,
        name: values.name,
        employeeId: values.employeeId,
        status: nextStatus,
      })
      setOpen(false)
    } catch {
      // Keep dialog open when request fails so user can retry.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update account details and role status.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor={`edit-name-${faculty.id}`} className="text-sm font-medium text-slate-700">
              Name
            </label>
            <Input
              id={`edit-name-${faculty.id}`}
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={`edit-employee-id-${faculty.id}`} className="text-sm font-medium text-slate-700">
              Employee ID
            </label>
            <Input
              id={`edit-employee-id-${faculty.id}`}
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value.toUpperCase())}
              required
              minLength={3}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={`edit-status-${faculty.id}`} className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id={`edit-status-${faculty.id}`}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-sans"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value as FacultyStatus)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isSubmitting}
              className="disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
