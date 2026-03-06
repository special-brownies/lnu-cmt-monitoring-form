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

  private static readonly OTHER_CATEGORY_NAME = 'Other'

  async create(dto: CreateCategoryDto) {
    const name = this.normalizeCategoryName(dto.name)
    await this.ensureNameIsUnique(name)

    try {
      return await this.prisma.category.create({
        data: {
          name,
          description: this.normalizeDescription(dto.description),
        },
      })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'category')
    }
  }

  async findAll() {
    await this.ensureOtherCategory()
    return this.prisma.category.findMany({ orderBy: { id: 'asc' } })
  }

  async findOne(id: number) {
    return this.ensureExists(id)
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const existingCategory = await this.ensureExists(id)

    const nextName =
      dto.name !== undefined
        ? this.normalizeCategoryName(dto.name)
        : existingCategory.name

    if (dto.name !== undefined) {
      await this.ensureNameIsUnique(nextName, id)
    }

    const data: Prisma.CategoryUpdateInput = {}

    if (dto.name !== undefined) {
      data.name = nextName
    }

    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description)
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data,
      })
    } catch (error: unknown) {
      this.handlePrismaError(error, 'category')
    }
  }

  async remove(id: number) {
    await this.ensureExists(id)
    const equipmentCount = await this.prisma.equipment.count({
      where: { categoryId: id },
    })

    if (equipmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete this category because it is currently used by equipment',
      )
    }

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

  private async ensureOtherCategory() {
    const existingOther = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: CategoryService.OTHER_CATEGORY_NAME,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })

    if (existingOther) {
      return existingOther
    }

    return this.prisma.category.create({
      data: {
        name: CategoryService.OTHER_CATEGORY_NAME,
        description: 'Fallback category for custom equipment types',
      },
      select: { id: true },
    })
  }

  private normalizeCategoryName(rawName: string) {
    const name = rawName.trim()

    if (name.length < 2) {
      throw new BadRequestException(
        'Category name must be at least 2 non-space characters',
      )
    }

    return name
  }

  private normalizeDescription(rawDescription?: string | null) {
    const description = rawDescription?.trim()
    return description && description.length > 0 ? description : null
  }

  private async ensureNameIsUnique(name: string, excludeId?: number) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })

    if (existingCategory) {
      throw new BadRequestException('A category with this name already exists')
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
