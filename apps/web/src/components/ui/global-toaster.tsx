"use client"

import { useEffect, useState } from "react"
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  EditIcon,
  InfoIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  ShieldPlusIcon,
  UserPlusIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react"
import { dismissToast, type ToastRecord, useToastStore } from "@/lib/toast-store"
import { cn } from "@/lib/utils"

const toneStyles = {
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "text-emerald-600",
    button: "hover:bg-emerald-100/80",
  },
  info: {
    container: "border-sky-200 bg-sky-50 text-sky-900",
    icon: "text-sky-600",
    button: "hover:bg-sky-100/80",
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
    button: "hover:bg-amber-100/80",
  },
  error: {
    container: "border-rose-200 bg-rose-50 text-rose-900",
    icon: "text-rose-600",
    button: "hover:bg-rose-100/80",
  },
} as const

type ToastIconProps = {
  iconName: ToastRecord["icon"]
  className?: string
}

function ToastIcon({ iconName, className }: ToastIconProps) {
  if (iconName === "user-plus") return <UserPlusIcon className={className} />
  if (iconName === "edit") return <EditIcon className={className} />
  if (iconName === "shield-plus") return <ShieldPlusIcon className={className} />
  if (iconName === "shield-check") return <ShieldCheckIcon className={className} />
  if (iconName === "check-circle") return <CheckCircle2Icon className={className} />
  if (iconName === "alert-triangle") return <AlertTriangleIcon className={className} />
  if (iconName === "wrench") return <WrenchIcon className={className} />
  if (iconName === "key") return <KeyRoundIcon className={className} />
  if (iconName === "error") return <AlertCircleIcon className={className} />
  return <InfoIcon className={className} />
}

type ToastItemProps = {
  toast: ToastRecord
}

function ToastItem({ toast }: ToastItemProps) {
  const [visible, setVisible] = useState(false)
  const styles = toneStyles[toast.tone]

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setVisible(true)
    })

    return () => {
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <article
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-xl border px-3 py-3 shadow-lg backdrop-blur transition-all duration-200 ease-out",
        styles.container,
        visible && !toast.exiting
          ? "translate-x-0 opacity-100"
          : "translate-x-4 opacity-0",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <ToastIcon
          iconName={toast.icon}
          className={cn("mt-0.5 h-5 w-5 shrink-0", styles.icon)}
        />
        <p className="flex-1 text-sm leading-snug">{toast.message}</p>
        <button
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-md text-current/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
            styles.button,
          )}
          aria-label="Dismiss notification"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}

export function GlobalToaster() {
  const toasts = useToastStore()

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
