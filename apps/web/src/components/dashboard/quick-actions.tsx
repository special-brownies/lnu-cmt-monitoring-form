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
          <CardDescription>
            {isAdmin
              ? "Frequently used operations"
              : "Request maintenance for equipment assigned to you"}
          </CardDescription>
        </CardHeader>
        {isAdmin ? (
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

            <Button
              variant="outline"
              className="h-auto justify-start gap-2 py-3 transition-colors hover:bg-slate-100"
              onClick={() => setScheduleOpen(true)}
            >
              <WrenchIcon className="size-4" />
              Schedule Maintenance
            </Button>

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
          </CardContent>
        ) : (
          <CardContent>
            <Button
              variant="outline"
              className="h-14 w-full justify-center gap-2 text-sm font-semibold transition-colors hover:bg-slate-100"
              onClick={() => setScheduleOpen(true)}
            >
              <WrenchIcon className="size-4" />
              Schedule Maintenance
            </Button>
          </CardContent>
        )}
      </Card>

      <ScheduleMaintenanceDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        title={isAdmin ? "Schedule Maintenance" : "Request Maintenance"}
        description={
          isAdmin
            ? "Select equipment and schedule a maintenance task."
            : "Submit a maintenance request for your assigned equipment."
        }
        submitLabel={isAdmin ? "Schedule Maintenance" : "Submit Request"}
        pendingLabel={isAdmin ? "Scheduling..." : "Submitting..."}
        scheduledDateLabel={isAdmin ? "Scheduled Date" : "Requested Date"}
        showTechnicianField={isAdmin}
      />
    </>
  )
}
