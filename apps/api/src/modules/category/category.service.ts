import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'category')
    }
  }

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { id: 'asc' } })
  }

  async findOne(id: number) {
    return this.ensureExists(id)
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.ensureExists(id)

    try {
      return await this.prisma.category.update({
        where: { id },
        data: dto,
      })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'category')
    }
  }

  async remove(id: number) {
    await this.ensureExists(id)

    try {
      return await this.prisma.category.delete({ where: { id } })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'category')
    }
  }

  private async ensureExists(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } })

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }

    return category
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
