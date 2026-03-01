"use client"

import { FormEvent, useState } from "react"
import { KeyRoundIcon } from "lucide-react"
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
import type { FacultyRecord } from "@/types/faculty"

type ResetPasswordDialogProps = {
  faculty: FacultyRecord
  isSubmitting: boolean
  onResetPassword: (id: string, password: string) => Promise<void>
}

export function ResetPasswordDialog({
  faculty,
  isSubmitting,
  onResetPassword,
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await onResetPassword(faculty.id, password)
      setPassword("")
      setOpen(false)
    } catch {
      // Keep dialog open when request fails so user can retry.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setPassword("")
        }
      }}
    >
      <DialogTrigger asChild>
        <ActionIcon icon={KeyRoundIcon} label={`Reset password for ${faculty.name}`} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {faculty.name} ({faculty.employeeId}).
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor={`reset-password-${faculty.id}`} className="text-sm font-medium text-slate-700">
              New Password
            </label>
            <Input
              id={`reset-password-${faculty.id}`}
              autoFocus
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={password.trim().length < 8 || isSubmitting}
              className="disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
