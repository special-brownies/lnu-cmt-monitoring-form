import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateFacultyDto } from './dto/create-faculty.dto'
import { UpdateFacultyDto } from './dto/update-faculty.dto'

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFacultyDto) {
    try {
      return await this.prisma.faculty.create({ data: dto })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'faculty')
    }
  }

  async findAll() {
    return this.prisma.faculty.findMany({ orderBy: { id: 'asc' } })
  }

  async findOne(id: number) {
    return this.ensureExists(id)
  }

  async update(id: number, dto: UpdateFacultyDto) {
    await this.ensureExists(id)

    try {
      return await this.prisma.faculty.update({
        where: { id },
        data: dto,
      })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'faculty')
    }
  }

  async remove(id: number) {
    await this.ensureExists(id)

    try {
      return await this.prisma.faculty.delete({ where: { id } })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'faculty')
    }
  }

  private async ensureExists(id: number) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id } })

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`)
    }

    return faculty
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
