"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type InputWithIconProps = {
  icon: React.ReactNode
  rightElement?: React.ReactNode
  containerClassName?: string
} & React.InputHTMLAttributes<HTMLInputElement>

export function InputWithIcon({
  icon,
  rightElement,
  className,
  containerClassName,
  ...props
}: InputWithIconProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <input
        className={cn(
          "h-11 w-full rounded-md border border-slate-300 bg-white pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900",
          rightElement ? "pr-11" : "pr-3",
          className,
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  )
}
