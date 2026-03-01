"use client"

import AuthGuard from "@/components/auth/AuthGuard"
import { PasswordRequestsDialog } from "@/components/dashboard/password-requests-dialog"
import { Button } from "@/components/ui/button"

export default function PasswordRequestsPage() {
  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN"]}>
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Password Requests</h1>
          <p className="mt-2 text-sm text-slate-600">
            Open the modal to review and resolve faculty password requests.
          </p>
          <div className="mt-4">
            <PasswordRequestsDialog
              trigger={
                <Button type="button" className="w-auto px-4">
                  Open Password Requests
                </Button>
              }
            />
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
