"use client"

import { useQuery } from "@tanstack/react-query"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getEquipmentList } from "@/lib/api/equipment"

function formatDateOnly(value: string | Date) {
  const date = new Date(value)
  return date.toISOString().slice(0, 10)
}

export default function MaintenancePage() {
  const maintenanceQuery = useQuery({
    queryKey: ["maintenance", "equipment"],
    queryFn: () => getEquipmentList({ status: "MAINTENANCE" }),
  })

  const equipmentList = maintenanceQuery.data ?? []

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">Maintenance Management</CardTitle>
        <CardDescription>
          Placeholder maintenance workspace with live equipment API connector.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {maintenanceQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : maintenanceQuery.isError ? (
          <div className="space-y-4">
            <EmptyState
              title="Unable to load maintenance records"
              description="Please try again."
            />
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void maintenanceQuery.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : equipmentList.length === 0 ? (
          <EmptyState
            title="No maintenance equipment"
            description="Equipment marked for maintenance will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Equipment Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Serial Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Assigned Faculty</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {equipmentList.map((equipment) => {
                  const lastUpdated = equipment.currentStatus?.changedAt ?? equipment.createdAt

                  return (
                    <tr key={equipment.id}>
                      <td className="px-4 py-3 text-slate-800">{equipment.name}</td>
                      <td className="px-4 py-3 text-slate-700">{equipment.serialNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{equipment.category?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{equipment.faculty?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDateOnly(lastUpdated)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
