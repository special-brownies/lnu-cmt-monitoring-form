"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { ActionIcon } from "@/components/ui/action-icon"
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
import type { SuperAdminRecord } from "@/types/user"

type DeleteAdminDialogProps = {
  admin: SuperAdminRecord
  isSubmitting: boolean
  onDelete: (id: string) => Promise<void>
}

export function DeleteAdminDialog({
  admin,
  isSubmitting,
  onDelete,
}: DeleteAdminDialogProps) {
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await onDelete(admin.id)
      setOpen(false)
    } catch {
      // Keep dialog open when request fails so user can retry.
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionIcon
          icon={Trash2Icon}
          label={`Delete ${admin.name}`}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Admin</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {admin.name} ({admin.email})? This action cannot be undone.
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
            {isSubmitting ? "Deleting..." : "Delete Admin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
