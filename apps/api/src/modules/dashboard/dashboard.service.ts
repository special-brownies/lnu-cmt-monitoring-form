import { Injectable } from '@nestjs/common'
import { MaintenanceStatus } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { EquipmentService } from '../equipment/equipment.service'

type EquipmentCategoryBucket =
  | 'Laptop'
  | 'Desktop'
  | 'Network Switch'
  | 'Printer'
  | 'Projector'
  | 'Other'

type LatestStatusCountRow = {
  normalized_status: string
  count: bigint | number
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly prisma: PrismaService,
  ) {}

  async getStats() {
    const summary = await this.equipmentService.findSummary()

    return {
      totalEquipment: summary.totalEquipment,
      activeEquipment: summary.activeEquipment,
      maintenanceCount: summary.maintenanceCount,
    }
  }

  async getAnalytics() {
    const [
      totalEquipment,
      categoryCounts,
      latestStatusCounts,
      totalAdmins,
      totalFaculty,
      totalRooms,
      activeMaintenanceCount,
      completedMaintenanceCount,
      statusChangesCount,
      passwordRequestsSubmittedCount,
    ] = await Promise.all([
      this.prisma.equipment.count(),
      this.prisma.category.findMany({
        select: {
          name: true,
          _count: {
            select: {
              equipments: true,
            },
          },
        },
      }),
      this.prisma.$queryRaw<LatestStatusCountRow[]>`
        SELECT
          CASE
            WHEN UPPER(TRIM(latest."status")) IN ('ACTIVE', 'ASSIGNED') THEN 'ACTIVE'
            WHEN UPPER(TRIM(latest."status")) IN ('MAINTENANCE', 'UNDER_MAINTENANCE') THEN 'MAINTENANCE'
            WHEN UPPER(TRIM(latest."status")) = 'DEFECTIVE' THEN 'DEFECTIVE'
            WHEN UPPER(TRIM(latest."status")) = 'AVAILABLE' THEN 'AVAILABLE'
            ELSE 'AVAILABLE'
          END AS normalized_status,
          COUNT(*)::bigint AS count
        FROM (
          SELECT DISTINCT ON ("equipmentId") "equipmentId", "status"
          FROM "EquipmentStatusHistory"
          ORDER BY "equipmentId", "changedAt" DESC, "id" DESC
        ) AS latest
        GROUP BY 1
      `,
      this.prisma.user.count(),
      this.prisma.faculty.count(),
      this.prisma.room.count(),
      this.prisma.maintenanceRecord.count({
        where: {
          status: MaintenanceStatus.UNDER_MAINTENANCE,
        },
      }),
      this.prisma.maintenanceRecord.count({
        where: { status: MaintenanceStatus.MAINTENANCE_COMPLETED },
      }),
      this.prisma.equipmentStatusHistory.count(),
      this.prisma.passwordResetRequest.count(),
    ])

    const statusCounts = {
      AVAILABLE: 0,
      ACTIVE: 0,
      MAINTENANCE: 0,
      DEFECTIVE: 0,
    }

    for (const row of latestStatusCounts) {
      const status = row.normalized_status.trim().toUpperCase()

      if (!(status in statusCounts)) {
        continue
      }

      statusCounts[status as keyof typeof statusCounts] = this.toNumber(row.count)
    }

    const categoryBuckets: Record<EquipmentCategoryBucket, number> = {
      Laptop: 0,
      Desktop: 0,
      'Network Switch': 0,
      Printer: 0,
      Projector: 0,
      Other: 0,
    }

    for (const category of categoryCounts) {
      const bucket = this.toCategoryBucket(category.name)
      categoryBuckets[bucket] += category._count.equipments
    }

    return {
      overview: {
        totalEquipment,
        activeEquipment: statusCounts.ACTIVE,
        equipmentUnderMaintenance: statusCounts.MAINTENANCE,
        defectiveEquipment: statusCounts.DEFECTIVE,
        totalUsers: totalAdmins + totalFaculty,
        totalRooms,
      },
      equipmentDistribution: [
        { category: 'Laptop', count: categoryBuckets.Laptop },
        { category: 'Desktop', count: categoryBuckets.Desktop },
        { category: 'Network Switch', count: categoryBuckets['Network Switch'] },
        { category: 'Printer', count: categoryBuckets.Printer },
        { category: 'Projector', count: categoryBuckets.Projector },
        { category: 'Other', count: categoryBuckets.Other },
      ],
      statusDistribution: [
        { status: 'Available', count: statusCounts.AVAILABLE },
        { status: 'Active', count: statusCounts.ACTIVE },
        { status: 'Maintenance', count: statusCounts.MAINTENANCE },
        { status: 'Defective', count: statusCounts.DEFECTIVE },
      ],
      activityInsights: {
        totalMaintenanceScheduled: activeMaintenanceCount,
        totalMaintenanceCompleted: completedMaintenanceCount,
        totalEquipmentStatusChanges: statusChangesCount,
        totalPasswordRequestsSubmitted: passwordRequestsSubmittedCount,
      },
      updatedAt: new Date().toISOString(),
    }
  }

  private toNumber(value: bigint | number): number {
    if (typeof value === 'bigint') {
      return Number(value)
    }

    return value
  }

  private toCategoryBucket(categoryName: string): EquipmentCategoryBucket {
    const normalized = categoryName.trim().toLowerCase()

    if (normalized.includes('laptop')) {
      return 'Laptop'
    }

    if (normalized.includes('desktop')) {
      return 'Desktop'
    }

    if (
      normalized.includes('network switch') ||
      normalized.includes('network device') ||
      normalized.includes('switch') ||
      normalized.includes('router') ||
      normalized.includes('access point') ||
      normalized.includes('access-point')
    ) {
      return 'Network Switch'
    }

    if (normalized.includes('printer')) {
      return 'Printer'
    }

    if (normalized.includes('projector')) {
      return 'Projector'
    }

    return 'Other'
  }
}
