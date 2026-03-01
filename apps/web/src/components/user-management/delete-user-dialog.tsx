"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { FacultyRecord } from "@/types/faculty"

type DeleteUserDialogProps = {
  faculty: FacultyRecord
  isSubmitting: boolean
  onDelete: (id: string) => Promise<void>
}

export function DeleteUserDialog({ faculty, isSubmitting, onDelete }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await onDelete(faculty.id)
      setOpen(false)
    } catch {
      // Keep dialog open when request fails so user can retry.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {faculty.name} ({faculty.employeeId})? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => void handleDelete()}
          >
            {isSubmitting ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
