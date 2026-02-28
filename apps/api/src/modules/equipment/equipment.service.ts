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

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll() {
    const equipments = await this.prisma.equipment.findMany({
      include: equipmentInclude,
      orderBy: { id: 'asc' },
    })

    return equipments.map((equipment) => this.formatEquipment(equipment))
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

  private async validateRelationIds(categoryId?: number, facultyId?: number) {
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
