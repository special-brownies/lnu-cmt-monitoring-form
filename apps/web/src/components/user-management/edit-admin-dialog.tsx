"use client"

import { FormEvent, useMemo, useState } from "react"
import { PencilIcon } from "lucide-react"
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
import type { FacultyStatus } from "@/types/faculty"
import type { SuperAdminRecord, UpdateSuperAdminInput } from "@/types/user"

type EditAdminDialogProps = {
  admin: SuperAdminRecord
  status: FacultyStatus
  isSubmitting: boolean
  onUpdate: (input: UpdateSuperAdminInput) => Promise<void>
}

export function EditAdminDialog({
  admin,
  status,
  isSubmitting,
  onUpdate,
}: EditAdminDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(admin.name)
  const [email, setEmail] = useState(admin.email)
  const [nextStatus, setNextStatus] = useState<FacultyStatus>(status)
  const [initialValues, setInitialValues] = useState({
    name: admin.name,
    email: admin.email,
    status,
  })

  const syncFormState = () => {
    setName(admin.name)
    setEmail(admin.email)
    setNextStatus(status)
    setInitialValues({
      name: admin.name,
      email: admin.email,
      status,
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      syncFormState()
    }

    setOpen(nextOpen)
  }

  const values = useMemo(
    () => ({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      status: nextStatus,
    }),
    [email, name, nextStatus],
  )

  const hasChanges = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues)
  }, [initialValues, values])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await onUpdate({
        id: admin.id,
        name: values.name,
        email: values.email,
        status: values.status,
      })
      setOpen(false)
    } catch {
      // Keep dialog open when request fails so user can retry.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ActionIcon icon={PencilIcon} label={`Edit ${admin.name}`} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
          <DialogDescription>Update admin account details and status.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor={`edit-admin-name-${admin.id}`} className="text-sm font-medium text-slate-700">
              Name
            </label>
            <Input
              id={`edit-admin-name-${admin.id}`}
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={`edit-admin-email-${admin.id}`} className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              id={`edit-admin-email-${admin.id}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              minLength={5}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={`edit-admin-status-${admin.id}`} className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id={`edit-admin-status-${admin.id}`}
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
