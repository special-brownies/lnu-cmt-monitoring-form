import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { MaintenanceStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateMaintenanceDto } from './dto/create-maintenance.dto'

const maintenanceInclude = {
  equipment: {
    include: {
      category: true,
      faculty: true,
      statusHistory: {
        orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
        take: 1,
      },
      locationHistory: {
        orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
        take: 1,
        include: { room: true },
      },
    },
  },
  scheduledBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  completedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.MaintenanceRecordInclude

type MaintenanceWithRelations = Prisma.MaintenanceRecordGetPayload<{
  include: typeof maintenanceInclude
}>

type MaintenanceFilters = {
  search?: string
  status?: string
}

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: MaintenanceFilters = {}) {
    const normalizedStatus = filters.status?.trim().toUpperCase() ?? ''
    const normalizedSearch = filters.search?.trim().toLowerCase() ?? ''

    const records = await this.prisma.maintenanceRecord.findMany({
      include: maintenanceInclude,
      orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
    })

    return records
      .filter((record) => {
        const matchesStatus =
          normalizedStatus.length === 0 ||
          record.status.trim().toUpperCase() === normalizedStatus

        const matchesSearch =
          normalizedSearch.length === 0 ||
          record.equipment.name.toLowerCase().includes(normalizedSearch) ||
          record.equipment.serialNumber.toLowerCase().includes(normalizedSearch)

        return matchesStatus && matchesSearch
      })
      .map((record) => this.formatRecord(record))
  }

  async create(dto: CreateMaintenanceDto, scheduledById: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
      include: {
        statusHistory: {
          orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
          take: 1,
        },
      },
    })

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${dto.equipmentId} not found`)
    }

    const currentStatus = equipment.statusHistory[0]?.status?.trim().toUpperCase() ?? ''
    const canBeScheduled =
      currentStatus === 'AVAILABLE' ||
      currentStatus === 'ACTIVE' ||
      currentStatus === 'ASSIGNED'

    if (!canBeScheduled) {
      throw new BadRequestException(
        'Only Available or Active equipment can be scheduled for maintenance',
      )
    }

    const activeMaintenance = await this.prisma.maintenanceRecord.findFirst({
      where: {
        equipmentId: dto.equipmentId,
        status: MaintenanceStatus.UNDER_MAINTENANCE,
      },
      select: { id: true },
    })

    if (activeMaintenance) {
      throw new BadRequestException(
        'Equipment already has an active maintenance record',
      )
    }

    const notes = this.buildStartNotes(dto)
    const created = await this.prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.create({
        data: {
          equipmentId: dto.equipmentId,
          scheduledDate: dto.scheduledDate,
          technician: dto.technician?.trim() || null,
          notes: dto.notes?.trim() || null,
          scheduledById,
          status: MaintenanceStatus.UNDER_MAINTENANCE,
        },
      })

      await tx.equipmentStatusHistory.create({
        data: {
          equipmentId: dto.equipmentId,
          status: 'MAINTENANCE',
          changedById: scheduledById,
          notes,
        },
      })

      return record
    })

    const result = await this.prisma.maintenanceRecord.findUnique({
      where: { id: created.id },
      include: maintenanceInclude,
    })

    if (!result) {
      throw new NotFoundException('Maintenance record not found after creation')
    }

    return this.formatRecord(result)
  }

  async complete(id: string, completedById: string) {
    const record = await this.prisma.maintenanceRecord.findUnique({
      where: { id },
      include: {
        equipment: {
          select: { id: true, name: true },
        },
      },
    })

    if (!record) {
      throw new NotFoundException('Maintenance record not found')
    }

    if (record.status !== MaintenanceStatus.UNDER_MAINTENANCE) {
      throw new BadRequestException('Maintenance record is already completed')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.maintenanceRecord.update({
        where: { id },
        data: {
          status: MaintenanceStatus.MAINTENANCE_COMPLETED,
          completedAt: new Date(),
          completedById,
        },
      })

      await tx.equipmentStatusHistory.create({
        data: {
          equipmentId: record.equipmentId,
          status: 'AVAILABLE',
          changedById: completedById,
          notes: `Maintenance completed for ${record.equipment.name}`,
        },
      })
    })

    const result = await this.prisma.maintenanceRecord.findUnique({
      where: { id },
      include: maintenanceInclude,
    })

    if (!result) {
      throw new NotFoundException('Maintenance record not found after completion')
    }

    return this.formatRecord(result)
  }

  private buildStartNotes(dto: CreateMaintenanceDto): string {
    const noteSegments = [
      `Maintenance started; scheduled for ${dto.scheduledDate.toISOString()}`,
    ]

    if (dto.technician?.trim()) {
      noteSegments.push(`technician: ${dto.technician.trim()}`)
    }

    if (dto.notes?.trim()) {
      noteSegments.push(`notes: ${dto.notes.trim()}`)
    }

    return noteSegments.join(' | ')
  }

  private formatRecord(record: MaintenanceWithRelations) {
    const currentStatus = record.equipment.statusHistory[0] ?? null
    const currentLocation = record.equipment.locationHistory[0] ?? null

    return {
      ...record,
      equipment: {
        ...record.equipment,
        currentStatus,
        currentRoom: currentLocation?.room ?? null,
      },
    }
  }
}
