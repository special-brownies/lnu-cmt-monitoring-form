"use client"

import { SORT_OPTIONS, type SortOption } from "@/lib/sort"
import { cn } from "@/lib/utils"

type SortSelectProps = {
  value: SortOption
  onChange: (value: SortOption) => void
  className?: string
  ariaLabel?: string
}

export function SortSelect({
  value,
  onChange,
  className,
  ariaLabel = "Sort records",
}: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as SortOption)}
      className={cn(
        "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-sans transition-all duration-200 ease-out",
        className,
      )}
      aria-label={ariaLabel}
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
