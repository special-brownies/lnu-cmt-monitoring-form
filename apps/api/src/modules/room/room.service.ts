import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateRoomDto } from './dto/create-room.dto'
import { UpdateRoomDto } from './dto/update-room.dto'

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomDto) {
    try {
      return await this.prisma.room.create({ data: dto })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'room')
    }
  }

  async findAll() {
    return this.prisma.room.findMany({ orderBy: { id: 'asc' } })
  }

  async findOne(id: number) {
    return this.ensureExists(id)
  }

  async update(id: number, dto: UpdateRoomDto) {
    await this.ensureExists(id)

    try {
      return await this.prisma.room.update({ where: { id }, data: dto })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'room')
    }
  }

  async remove(id: number) {
    await this.ensureExists(id)

    try {
      return await this.prisma.room.delete({ where: { id } })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'room')
    }
  }

  async ensureExists(id: number) {
    const room = await this.prisma.room.findUnique({ where: { id } })

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`)
    }

    return room
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
