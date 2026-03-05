"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { getEquipmentTimeline } from "@/lib/api/equipment"
import type { TimelineRange } from "@/types/equipment"

type EquipmentTimelineDialogProps = {
  equipmentId?: number
  equipmentName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EquipmentTimelineDialog({
  equipmentId,
  equipmentName,
  open,
  onOpenChange,
}: EquipmentTimelineDialogProps) {
  const [range, setRange] = useState<TimelineRange>("all")

  const timelineQuery = useQuery({
    queryKey: ["equipment", "timeline", equipmentId, range],
    queryFn: () => getEquipmentTimeline(equipmentId!, range),
    enabled: open && equipmentId !== undefined,
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          setRange("all")
        }
      }}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {equipmentName ? `${equipmentName} Timeline` : "Equipment Timeline"}
          </DialogTitle>
          <DialogDescription>Latest equipment history events.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-slate-500">Filter:</span>
            <div className="inline-flex flex-wrap items-center justify-end rounded-md border border-slate-200 p-1">
              <Button
                type="button"
                variant={range === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 whitespace-nowrap"
                onClick={() => setRange("all")}
              >
                All Time
              </Button>
              <Button
                type="button"
                variant={range === "24h" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 whitespace-nowrap"
                onClick={() => setRange("24h")}
              >
                Last 24 hours
              </Button>
              <Button
                type="button"
                variant={range === "7d" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 whitespace-nowrap"
                onClick={() => setRange("7d")}
              >
                Last 7 days
              </Button>
              <Button
                type="button"
                variant={range === "30d" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 whitespace-nowrap"
                onClick={() => setRange("30d")}
              >
                Last 30 days
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] min-h-[20rem] overflow-y-auto rounded-lg border border-slate-200 px-4 py-3">
          {timelineQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : timelineQuery.isError ? (
            <div className="space-y-4 pt-8">
              <EmptyState
                title="Unable to load timeline"
                description="There was an issue fetching timeline events."
              />
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => void timelineQuery.refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : (timelineQuery.data ?? []).length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {range === "all"
                ? "No timeline events available for this equipment."
                : "No timeline events for this time range."}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {(timelineQuery.data ?? []).map((event) => (
                <div key={event.id} className="relative pl-6">
                  <span className="absolute top-2 left-0 h-2 w-2 rounded-full bg-slate-400" />
                  <p className="text-sm font-medium text-slate-800">{event.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
