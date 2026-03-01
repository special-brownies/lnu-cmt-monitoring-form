import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

type ActivityRecord = {
  id: string
  description: string
  createdAt: string
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecent(limit = 12): Promise<ActivityRecord[]> {
    const [statusEvents, locationEvents] = await Promise.all([
      this.prisma.equipmentStatusHistory.findMany({
        take: limit,
        orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
        include: {
          equipment: {
            select: {
              serialNumber: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.equipmentLocationHistory.findMany({
        take: limit,
        orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
        include: {
          equipment: {
            select: {
              serialNumber: true,
              name: true,
            },
          },
          room: {
            select: {
              name: true,
            },
          },
        },
      }),
    ])

    const statusActivities = statusEvents.map((event) => ({
      id: `status-${event.id}`,
      description: `Status updated to ${event.status} for ${event.equipment.name} (${event.equipment.serialNumber})`,
      createdAt: event.changedAt.toISOString(),
    }))

    const locationActivities = locationEvents.map((event) => ({
      id: `location-${event.id}`,
      description: `${event.equipment.name} (${event.equipment.serialNumber}) assigned to ${event.room.name}`,
      createdAt: event.assignedAt.toISOString(),
    }))

    return [...statusActivities, ...locationActivities]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      )
      .slice(0, limit)
  }
}
