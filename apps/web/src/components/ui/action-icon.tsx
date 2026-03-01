"use client"

import type { ComponentProps } from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActionIconProps = Omit<ComponentProps<typeof Button>, "variant" | "size" | "children"> & {
  icon: LucideIcon
  label: string
  iconClassName?: string
}

export function ActionIcon({
  icon: Icon,
  label,
  className,
  iconClassName,
  ...props
}: ActionIconProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      className={cn("h-8 w-8", className)}
      {...props}
    >
      <Icon className={cn("h-4 w-4", iconClassName)} />
    </Button>
  )
}
