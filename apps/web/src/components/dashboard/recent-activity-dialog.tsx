"use client"

import { useMemo, useState } from "react"
import { ActivityIcon } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { Activity } from "@/types/dashboard"

type RecentActivityDialogProps = {
  activities: Activity[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

type FilterRange = "24h" | "7d" | "30d"

function filterActivities(activities: Activity[], range: FilterRange) {
  const now = new Date()
  const cutoff = new Date(now)

  if (range === "24h") {
    cutoff.setHours(now.getHours() - 24)
  }

  if (range === "7d") {
    cutoff.setDate(now.getDate() - 7)
  }

  if (range === "30d") {
    cutoff.setDate(now.getDate() - 30)
  }

  return activities.filter((activity) => new Date(activity.createdAt) >= cutoff)
}

export function RecentActivityDialog({
  activities,
  isLoading,
  isError,
  onRetry,
}: RecentActivityDialogProps) {
  const [filterRange, setFilterRange] = useState<FilterRange>("24h")

  const sortedActivities = useMemo(() => {
    return [...activities].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    )
  }, [activities])

  const filteredActivities = useMemo(() => {
    return filterActivities(sortedActivities, filterRange)
  }, [filterRange, sortedActivities])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle>All Activity</DialogTitle>
              <DialogDescription>Sorted by latest activity</DialogDescription>
            </div>

            <div className="flex items-center gap-2 self-start">
              <span className="text-xs text-slate-500">Filter:</span>
              <div className="inline-flex items-center rounded-md border border-slate-200 p-1">
                <Button
                  type="button"
                  variant={filterRange === "24h" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8"
                  onClick={() => setFilterRange("24h")}
                >
                  Last 24 hours
                </Button>
                <Button
                  type="button"
                  variant={filterRange === "7d" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8"
                  onClick={() => setFilterRange("7d")}
                >
                  Last 7 days
                </Button>
                <Button
                  type="button"
                  variant={filterRange === "30d" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8"
                  onClick={() => setFilterRange("30d")}
                >
                  Last 30 days
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="space-y-4">
            <EmptyState
              title="Unable to load activities"
              description="There was an issue fetching recent activity."
            />
            <div className="flex justify-center">
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No activity found for this time range
          </div>
        ) : (
          <div className="animate-in fade-in max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="animate-in fade-in relative rounded-lg border border-slate-200 bg-white p-3 pl-9 duration-200"
              >
                <ActivityIcon className="absolute top-3 left-3 size-4 text-slate-400" />
                <p className="text-sm text-slate-700">{activity.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
