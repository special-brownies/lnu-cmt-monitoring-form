"use client"

import { useState } from "react"
import {
  Building2Icon,
  KeyRoundIcon,
  PencilRulerIcon,
  PlusCircleIcon,
  ShieldUserIcon,
  WrenchIcon,
} from "lucide-react"
import { CategoryManagerDialog } from "@/components/dashboard/category-manager-dialog"
import { ScheduleMaintenanceDialog } from "@/components/maintenance/schedule-maintenance-dialog"
import { PasswordRequestsDialog } from "@/components/dashboard/password-requests-dialog"
import { RoomManagerDialog } from "@/components/dashboard/room-manager-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type QuickActionsProps = {
  isAdmin: boolean
  onNavigateDeveloping: (path: string, message: string) => void
}

export function QuickActions({ isAdmin, onNavigateDeveloping }: QuickActionsProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false)

  return (
    <>
      <Card className="border-slate-200 transition-shadow duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Frequently used operations</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
            onClick={() =>
              onNavigateDeveloping(
                "/equipment",
                "Opening Equipment Management...",
              )
            }
          >
            <PlusCircleIcon className="size-4" />
            Add Equipment
          </Button>

          {isAdmin && (
            <RoomManagerDialog
              trigger={
                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
                >
                  <Building2Icon className="size-4" />
                  Add Room
                </Button>
              }
            />
          )}

          {isAdmin && (
            <CategoryManagerDialog
              trigger={
                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
                >
                  <PencilRulerIcon className="size-4" />
                  Edit Categories
                </Button>
              }
            />
          )}

          {isAdmin && (
            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
              onClick={() =>
                onNavigateDeveloping(
                  "/users",
                  "Opening User Management...",
                )
              }
            >
              <ShieldUserIcon className="size-4" />
              Create User
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
              onClick={() => setScheduleOpen(true)}
            >
              <WrenchIcon className="size-4" />
              Schedule Maintenance
            </Button>
          )}

          {isAdmin && (
            <PasswordRequestsDialog
              trigger={
                <Button
                  variant="outline"
                  className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
                >
                  <KeyRoundIcon className="size-4" />
                  Password Requests
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <ScheduleMaintenanceDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />
    </>
  )
}
