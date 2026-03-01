import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateEquipmentDto } from './dto/create-equipment.dto'
import { UpdateEquipmentDto } from './dto/update-equipment.dto'

const equipmentInclude = {
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
} satisfies Prisma.EquipmentInclude

type EquipmentWithRelations = Prisma.EquipmentGetPayload<{
  include: typeof equipmentInclude
}>

type EquipmentQueryFilters = {
  search?: string
  status?: string
  categoryId?: number
}

type TimelineRange = '24h' | '7d' | '30d'

type EquipmentTimelineEvent = {
  id: string
  type: 'STATUS' | 'MAINTENANCE' | 'LOCATION' | 'FACULTY'
  description: string
  createdAt: string
}

function normalizeTimelineRange(range?: string): TimelineRange {
  if (range === '7d' || range === '30d') {
    return range
  }

  return '24h'
}

function getTimelineCutoff(range: TimelineRange): Date {
  const now = new Date()
  const cutoff = new Date(now)

  if (range === '24h') {
    cutoff.setHours(now.getHours() - 24)
    return cutoff
  }

  if (range === '7d') {
    cutoff.setDate(now.getDate() - 7)
    return cutoff
  }

  cutoff.setDate(now.getDate() - 30)
  return cutoff
}

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findSummary() {
    const equipments = await this.prisma.equipment.findMany({
      select: {
        id: true,
        statusHistory: {
          orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
          take: 1,
          select: { status: true },
        },
      },
    })

    const summary = {
      totalEquipment: equipments.length,
      activeEquipment: 0,
      maintenanceCount: 0,
      defectiveCount: 0,
      assignedCount: 0,
      availableCount: 0,
      uncategorizedCount: 0,
    }

    for (const equipment of equipments) {
      const status = equipment.statusHistory[0]?.status
        ? equipment.statusHistory[0].status.trim().toUpperCase()
        : ''

      if (status === 'ACTIVE') {
        summary.activeEquipment += 1
      } else if (status === 'MAINTENANCE') {
        summary.maintenanceCount += 1
      } else if (status === 'DEFECTIVE') {
        summary.defectiveCount += 1
      } else if (status === 'ASSIGNED') {
        summary.assignedCount += 1
      } else if (status === 'AVAILABLE') {
        summary.availableCount += 1
      } else {
        summary.uncategorizedCount += 1
      }
    }

    return summary
  }

  async create(dto: CreateEquipmentDto) {
    await this.validateRelationIds(dto.categoryId, dto.facultyId)

    try {
      const equipment = await this.prisma.equipment.create({
        data: dto,
        include: equipmentInclude,
      })

      return this.formatEquipment(equipment)
    } catch (error: unknown) {
      this.handlePrismaError(error, 'equipment')
    }
  }

  async findAll(filters: EquipmentQueryFilters = {}) {
    const normalizedSearch = filters.search?.trim().toLowerCase() ?? ''
    const normalizedStatus = filters.status?.trim().toUpperCase() ?? ''

    const equipments = await this.prisma.equipment.findMany({
      include: equipmentInclude,
      orderBy: { id: 'asc' },
    })

    return equipments
      .map((equipment) => this.formatEquipment(equipment))
      .filter((equipment) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          equipment.name.toLowerCase().includes(normalizedSearch) ||
          equipment.serialNumber.toLowerCase().includes(normalizedSearch)

        const matchesStatus =
          normalizedStatus.length === 0 ||
          equipment.currentStatus?.status?.trim().toUpperCase() === normalizedStatus ||
          (normalizedStatus === 'AVAILABLE' &&
            equipment.currentStatus?.status?.trim().toUpperCase() === 'ACTIVE')

        const matchesCategory =
          filters.categoryId === undefined ||
          equipment.categoryId === filters.categoryId

        return matchesSearch && matchesStatus && matchesCategory
      })
  }

  async findOne(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: equipmentInclude,
    })

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`)
    }

    return this.formatEquipment(equipment)
  }

  async update(id: number, dto: UpdateEquipmentDto) {
    await this.ensureExists(id)

    if (dto.categoryId !== undefined || dto.facultyId !== undefined) {
      await this.validateRelationIds(dto.categoryId, dto.facultyId)
    }

    try {
      const equipment = await this.prisma.equipment.update({
        where: { id },
        data: dto,
        include: equipmentInclude,
      })

      return this.formatEquipment(equipment)
    } catch (error: unknown) {
      this.handlePrismaError(error, 'equipment')
    }
  }

  async remove(id: number) {
    await this.ensureExists(id)

    try {
      return await this.prisma.equipment.delete({ where: { id } })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'equipment')
    }
  }

  async ensureExists(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`)
    }

    return equipment
  }

  async findTimeline(
    id: number,
    rangeInput?: string,
  ): Promise<EquipmentTimelineEvent[]> {
    const range = normalizeTimelineRange(rangeInput)
    const cutoff = getTimelineCutoff(range)

    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        serialNumber: true,
        faculty: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        createdAt: true,
      },
    })

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`)
    }

    const [statusEvents, locationEvents] = await Promise.all([
      this.prisma.equipmentStatusHistory.findMany({
        where: {
          equipmentId: id,
          changedAt: {
            gte: cutoff,
          },
        },
        orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
        include: {
          changedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.equipmentLocationHistory.findMany({
        where: {
          equipmentId: id,
          assignedAt: {
            gte: cutoff,
          },
        },
        orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
        include: {
          room: {
            select: {
              id: true,
              name: true,
              building: true,
              floor: true,
            },
          },
        },
      }),
    ])

    const timeline: EquipmentTimelineEvent[] = []

    for (let index = 0; index < statusEvents.length; index += 1) {
      const event = statusEvents[index]
      const normalizedStatus = event.status.trim().toUpperCase()
      const olderEvent = statusEvents[index + 1]
      const olderStatus = olderEvent?.status?.trim().toUpperCase() ?? ''

      timeline.push({
        id: `status-${event.id}`,
        type: 'STATUS',
        description: `Status changed to ${event.status}`,
        createdAt: event.changedAt.toISOString(),
      })

      if (olderStatus === 'MAINTENANCE' && normalizedStatus !== 'MAINTENANCE') {
        timeline.push({
          id: `maintenance-${event.id}`,
          type: 'MAINTENANCE',
          description: `Maintenance completed (status changed to ${event.status})`,
          createdAt: event.changedAt.toISOString(),
        })
      }

      if (event.notes?.toLowerCase().includes('faculty reassigned')) {
        timeline.push({
          id: `faculty-note-${event.id}`,
          type: 'FACULTY',
          description: event.notes,
          createdAt: event.changedAt.toISOString(),
        })
      }
    }

    for (const event of locationEvents) {
      timeline.push({
        id: `location-${event.id}`,
        type: 'LOCATION',
        description: `Location changed to ${event.room.name}`,
        createdAt: event.assignedAt.toISOString(),
      })
    }

    if (equipment.faculty && equipment.createdAt >= cutoff) {
      timeline.push({
        id: `faculty-current-${equipment.id}`,
        type: 'FACULTY',
        description: `Faculty assigned to ${equipment.faculty.name} (${equipment.faculty.employeeId})`,
        createdAt: equipment.createdAt.toISOString(),
      })
    }

    return timeline.sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    )
  }

  private async validateRelationIds(categoryId?: number, facultyId?: string) {
    if (categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      })

      if (!category) {
        throw new BadRequestException(`Category with ID ${categoryId} does not exist`)
      }
    }

    if (facultyId !== undefined) {
      const faculty = await this.prisma.faculty.findUnique({
        where: { id: facultyId },
        select: { id: true },
      })

      if (!faculty) {
        throw new BadRequestException(`Faculty with ID ${facultyId} does not exist`)
      }
    }
  }

  private formatEquipment(equipment: EquipmentWithRelations) {
    const currentStatus = equipment.statusHistory[0] ?? null
    const currentLocation = equipment.locationHistory[0] ?? null

    return {
      ...equipment,
      currentStatus,
      currentRoom: currentLocation?.room ?? null,
    }
  }

  private handlePrismaError(error: unknown, entity: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          `A ${entity} with the same unique value already exists`,
        )
      }

      if (error.code === 'P2003') {
        throw new BadRequestException(
          `Cannot delete this ${entity} because it is referenced by other records`,
        )
      }
    }

    throw error
  }
}
