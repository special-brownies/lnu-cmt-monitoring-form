"use client"

import { ReactElement, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api/client"

type PasswordRequestRecord = {
  id: string
  status: "PENDING" | "COMPLETED"
  requestedAt: string
  resolvedAt: string | null
  faculty: {
    id: string
    employeeId: string
    name: string
  }
}

type ResolvePayload = {
  requestId: string
  newPassword: string
}

type PasswordRequestsDialogProps = {
  trigger: ReactElement
}

async function getPasswordRequests() {
  return apiClient<PasswordRequestRecord[]>("/password-requests", {
    cache: "no-store",
  })
}

async function resolvePasswordRequest(payload: ResolvePayload) {
  return apiClient<PasswordRequestRecord>(
    `/password-requests/${payload.requestId}/resolve`,
    {
      method: "POST",
      body: JSON.stringify({ newPassword: payload.newPassword }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

export function PasswordRequestsDialog({ trigger }: PasswordRequestsDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const requestsQuery = useQuery({
    queryKey: ["password-requests"],
    queryFn: getPasswordRequests,
    enabled: open,
  })

  const resolveMutation = useMutation({
    mutationFn: resolvePasswordRequest,
    onSuccess: async () => {
      setSelectedRequestId(null)
      setNewPassword("")
      setLocalError(null)
      await queryClient.invalidateQueries({ queryKey: ["password-requests"] })
    },
    onError: (error) => {
      setLocalError(error instanceof Error ? error.message : "Failed to resolve request")
    },
  })

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) {
      return null
    }

    const requests = requestsQuery.data ?? []
    return requests.find((request) => request.id === selectedRequestId) ?? null
  }, [requestsQuery.data, selectedRequestId])

  const passwordRequests = requestsQuery.data ?? []

  const pendingRequests = useMemo(() => {
    return passwordRequests.filter((request) => request.status === "PENDING")
  }, [passwordRequests])

  const resolvedRequests = useMemo(() => {
    return passwordRequests.filter((request) => request.status === "COMPLETED")
  }, [passwordRequests])

  const handleResolve = () => {
    if (!selectedRequest) {
      return
    }

    if (newPassword.trim().length < 8) {
      setLocalError("New password must be at least 8 characters")
      return
    }

    resolveMutation.mutate({
      requestId: selectedRequest.id,
      newPassword: newPassword.trim(),
    })
  }

  const renderTable = (
    requests: PasswordRequestRecord[],
    showResolveAction: boolean,
  ) => {
    if (requests.length === 0) {
      return (
        <div className="py-10 text-center text-muted-foreground">
          No requests found.
        </div>
      )
    }

    return (
      <div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee ID</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Faculty Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Requested At</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-3 text-slate-800">{request.faculty.employeeId}</td>
                <td className="px-4 py-3 text-slate-800">{request.faculty.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      request.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {request.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {new Date(request.requestedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {showResolveAction ? (
                    <Button
                      type="button"
                      className="w-auto px-3 py-2 text-xs"
                      disabled={request.status !== "PENDING"}
                      onClick={() => {
                        setSelectedRequestId(request.id)
                        setNewPassword("")
                        setLocalError(null)
                      }}
                    >
                      Resolve
                    </Button>
                  ) : (
                    <Button type="button" className="w-auto px-3 py-2 text-xs" disabled>
                      Resolved
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setSelectedRequestId(null)
          setNewPassword("")
          setLocalError(null)
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Password Requests</DialogTitle>
          <DialogDescription>
            Resolve faculty password requests from the admin helpdesk queue.
          </DialogDescription>
        </DialogHeader>

        {localError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {localError}
          </p>
        )}

        {selectedRequest && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Set new password for {selectedRequest.faculty.employeeId} ({selectedRequest.faculty.name})
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedRequestId(null)
                    setNewPassword("")
                    setLocalError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleResolve} disabled={resolveMutation.isPending}>
                  {resolveMutation.isPending ? "Resolving..." : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {requestsQuery.isLoading ? (
          <p className="text-sm text-slate-600">Loading requests...</p>
        ) : requestsQuery.isError ? (
          <div className="space-y-4">
            <EmptyState
              title="Unable to load requests"
              description="There was an issue fetching password requests."
            />
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void requestsQuery.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="bg-muted mb-4 rounded-lg p-1">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="resolved"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Resolved
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {renderTable(pendingRequests, true)}
            </TabsContent>

            <TabsContent value="resolved">
              {renderTable(resolvedRequests, false)}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
