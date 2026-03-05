import { useSyncExternalStore } from 'react'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'
export type ToastIcon =
  | 'user-plus'
  | 'edit'
  | 'shield-plus'
  | 'shield-check'
  | 'check-circle'
  | 'alert-triangle'
  | 'wrench'
  | 'key'
  | 'error'
  | 'info'

export type ToastInput = {
  message: string
  tone: ToastTone
  icon: ToastIcon
}

export type ToastRecord = ToastInput & {
  id: string
  exiting: boolean
}

const TOAST_DURATION_MS = 5_000
const TOAST_EXIT_DURATION_MS = 220
const MAX_ACTIVE_TOASTS = 4
const SERVER_SNAPSHOT: ToastRecord[] = []

let toastRecords: ToastRecord[] = []
const subscribers = new Set<() => void>()
const dismissalTimers = new Map<string, number>()
const removalTimers = new Map<string, number>()
let sequence = 0

function notifySubscribers() {
  for (const subscriber of subscribers) {
    subscriber()
  }
}

function clearToastTimers(id: string) {
  const dismissalTimer = dismissalTimers.get(id)
  if (dismissalTimer !== undefined) {
    window.clearTimeout(dismissalTimer)
    dismissalTimers.delete(id)
  }

  const removalTimer = removalTimers.get(id)
  if (removalTimer !== undefined) {
    window.clearTimeout(removalTimer)
    removalTimers.delete(id)
  }
}

function removeToast(id: string) {
  if (typeof window === 'undefined') {
    return
  }

  clearToastTimers(id)
  toastRecords = toastRecords.filter((record) => record.id !== id)
  notifySubscribers()
}

export function dismissToast(id: string) {
  if (typeof window === 'undefined') {
    return
  }

  const target = toastRecords.find((record) => record.id === id)

  if (!target || target.exiting) {
    return
  }

  toastRecords = toastRecords.map((record) =>
    record.id === id ? { ...record, exiting: true } : record,
  )
  notifySubscribers()

  const removalTimer = window.setTimeout(() => {
    removeToast(id)
  }, TOAST_EXIT_DURATION_MS)
  removalTimers.set(id, removalTimer)
}

export function pushToast(input: ToastInput): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (toastRecords.length >= MAX_ACTIVE_TOASTS) {
    const oldest = toastRecords[0]
    if (oldest) {
      removeToast(oldest.id)
    }
  }

  sequence += 1
  const id = `toast-${Date.now()}-${sequence}`
  toastRecords = [...toastRecords, { ...input, id, exiting: false }]
  notifySubscribers()

  const dismissalTimer = window.setTimeout(() => {
    dismissToast(id)
  }, TOAST_DURATION_MS)
  dismissalTimers.set(id, dismissalTimer)

  return id
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber)

  return () => {
    subscribers.delete(subscriber)
  }
}

function getSnapshot() {
  return toastRecords
}

function getServerSnapshot(): ToastRecord[] {
  return SERVER_SNAPSHOT
}

export function useToastStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
