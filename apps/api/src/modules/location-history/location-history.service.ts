import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { EquipmentService } from '../equipment/equipment.service'
import { RoomService } from '../room/room.service'
import { CreateLocationDto } from './dto/create-location.dto'

@Injectable()
export class LocationHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: EquipmentService,
    private readonly roomService: RoomService,
  ) {}

  async create(dto: CreateLocationDto) {
    await this.equipmentService.ensureExists(dto.equipmentId)
    await this.roomService.ensureExists(dto.roomId)

    if (dto.assignedById !== undefined) {
      await this.ensureUserExists(dto.assignedById)
    }

    const latestAssignment = await this.prisma.equipmentLocationHistory.findFirst({
      where: { equipmentId: dto.equipmentId },
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      select: { roomId: true },
    })

    if (latestAssignment?.roomId === dto.roomId) {
      throw new BadRequestException(
        `Equipment ${dto.equipmentId} is already assigned to room ${dto.roomId}`,
      )
    }

    try {
      return await this.prisma.equipmentLocationHistory.create({
        data: dto,
        include: {
          equipment: true,
          room: true,
          assignedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
      })
    } catch (error: unknown) {
      this.handlePrismaError(error)
    }
  }

  async findByEquipment(equipmentId: number) {
    await this.equipmentService.ensureExists(equipmentId)

    return this.prisma.equipmentLocationHistory.findMany({
      where: { equipmentId },
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      include: {
        room: true,
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    })
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not exist`)
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid relation ID provided')
      }
    }

    throw error
  }
}
