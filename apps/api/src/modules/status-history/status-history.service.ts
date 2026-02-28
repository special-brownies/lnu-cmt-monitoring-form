import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { EquipmentService } from '../equipment/equipment.service'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateStatusDto } from './dto/create-status.dto'

@Injectable()
export class StatusHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: EquipmentService,
  ) {}

  async create(dto: CreateStatusDto) {
    await this.equipmentService.ensureExists(dto.equipmentId)

    if (dto.changedById !== undefined) {
      await this.ensureUserExists(dto.changedById)
    }

    try {
      return await this.prisma.equipmentStatusHistory.create({
        data: dto,
        include: {
          equipment: true,
          changedBy: {
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

    return this.prisma.equipmentStatusHistory.findMany({
      where: { equipmentId },
      orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
      include: {
        changedBy: {
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
