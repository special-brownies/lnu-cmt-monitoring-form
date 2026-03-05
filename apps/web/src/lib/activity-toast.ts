import { pushToast } from "@/lib/toast-store"

type EquipmentStatusLike = string | null | undefined

function normalizeStatus(status: EquipmentStatusLike) {
  const value = status?.trim().toUpperCase()

  if (!value) {
    return null
  }

  if (value === "ASSIGNED" || value === "ACTIVE") {
    return "ACTIVE"
  }

  if (value === "AVAILABLE") {
    return "AVAILABLE"
  }

  if (value === "DEFECTIVE") {
    return "DEFECTIVE"
  }

  if (value === "MAINTENANCE" || value === "UNDER_MAINTENANCE") {
    return "MAINTENANCE"
  }

  return null
}

function withSubject(subject: string | undefined, message: string) {
  if (!subject || subject.trim().length === 0) {
    return message
  }

  return `${subject.trim()}: ${message}`
}

export function notifyUserCreated() {
  pushToast({
    tone: "success",
    icon: "user-plus",
    message: "User created successfully.",
  })
}

export function notifyUserEdited() {
  pushToast({
    tone: "info",
    icon: "edit",
    message: "User profile updated.",
  })
}

export function notifyAdminCreated() {
  pushToast({
    tone: "success",
    icon: "shield-plus",
    message: "Admin account created successfully.",
  })
}

export function notifyAdminEdited() {
  pushToast({
    tone: "info",
    icon: "shield-check",
    message: "Admin account updated.",
  })
}

export function notifyPasswordRequestSubmitted() {
  pushToast({
    tone: "info",
    icon: "key",
    message: "Password request submitted.",
  })
}

export function notifyPasswordRequestResolved(subject?: string) {
  pushToast({
    tone: "info",
    icon: "check-circle",
    message: withSubject(subject, "Password request resolved."),
  })
}

export function notifyEquipmentStatusChange(
  nextStatus: EquipmentStatusLike,
  previousStatus?: EquipmentStatusLike,
  subject?: string,
) {
  const normalizedNextStatus = normalizeStatus(nextStatus)
  const normalizedPreviousStatus = normalizeStatus(previousStatus)

  if (!normalizedNextStatus) {
    return
  }

  if (normalizedNextStatus === "DEFECTIVE") {
    pushToast({
      tone: "warning",
      icon: "alert-triangle",
      message: withSubject(subject, "Equipment marked as defective."),
    })
    return
  }

  if (normalizedNextStatus === "MAINTENANCE") {
    pushToast({
      tone: "warning",
      icon: "wrench",
      message: withSubject(subject, "Equipment marked as under maintenance."),
    })
    return
  }

  if (normalizedPreviousStatus === "MAINTENANCE") {
    pushToast({
      tone: "success",
      icon: "check-circle",
      message: withSubject(subject, "Maintenance completed."),
    })
    return
  }

  if (normalizedNextStatus === "AVAILABLE") {
    pushToast({
      tone: "success",
      icon: "check-circle",
      message: withSubject(subject, "Status changed to Available."),
    })
    return
  }

  if (normalizedNextStatus === "ACTIVE") {
    pushToast({
      tone: "success",
      icon: "check-circle",
      message: withSubject(subject, "Status changed to Active."),
    })
  }
}

export function notifyError(message: string) {
  pushToast({
    tone: "error",
    icon: "error",
    message,
  })
}

export function notifyInfo(message: string) {
  pushToast({
    tone: "info",
    icon: "info",
    message,
  })
}

export function notifySuccess(message: string) {
  pushToast({
    tone: "success",
    icon: "check-circle",
    message,
  })
}
