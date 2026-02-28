"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusLabel =
  | "Active"
  | "Maintenance"
  | "Inactive"
  | "Assigned"
  | "Available"
  | "Defective"

const statusStyles: Record<StatusLabel, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Maintenance: "bg-amber-100 text-amber-700 border-amber-200",
  Inactive: "bg-slate-200 text-slate-700 border-slate-300",
  Assigned: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  Available: "bg-sky-100 text-sky-700 border-sky-200",
  Defective: "bg-slate-900 text-white border-slate-900",
}

export function StatusBadge({
  status,
  className,
}: {
  status: StatusLabel
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("px-2.5 py-0.5 text-xs font-medium", statusStyles[status], className)}
    >
      {status}
    </Badge>
  )
}
