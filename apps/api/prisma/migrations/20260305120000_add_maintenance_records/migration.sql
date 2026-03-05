CREATE TYPE "MaintenanceStatus" AS ENUM ('UNDER_MAINTENANCE', 'MAINTENANCE_COMPLETED');

CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "scheduledById" TEXT,
    "completedById" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "technician" TEXT,
    "notes" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'UNDER_MAINTENANCE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MaintenanceRecord_equipmentId_status_idx" ON "MaintenanceRecord"("equipmentId", "status");
CREATE INDEX "MaintenanceRecord_status_scheduledDate_idx" ON "MaintenanceRecord"("status", "scheduledDate");

ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_equipmentId_fkey"
  FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_scheduledById_fkey"
  FOREIGN KEY ("scheduledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_completedById_fkey"
  FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
