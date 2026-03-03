import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

function normalizeStatus(status?: string): string {
  if (!status) {
    return 'Active'
  }

  return status.trim().toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active'
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: Role.SUPER_ADMIN },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findOne(id: string) {
    return this.ensureExists(id)
  }

  async create(dto: CreateUserDto) {
    this.validateAccountRules(dto)

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    if (dto.role === Role.SUPER_ADMIN) {
      try {
        const user = await this.prisma.user.create({
          data: {
            name: dto.name,
            email: this.normalizeEmail(dto.email!),
            password: hashedPassword,
            role: Role.SUPER_ADMIN,
            status: normalizeStatus(dto.status),
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        return {
          accountType: 'SUPER_ADMIN',
          ...user,
        }
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('SUPER_ADMIN account already exists')
        }

        throw error
      }
    }

    try {
      const faculty = await this.prisma.faculty.create({
        data: {
          name: dto.name,
          employeeId: this.normalizeEmployeeId(dto.employeeId!),
          password: hashedPassword,
          status: normalizeStatus(dto.status),
        },
        select: {
          id: true,
          name: true,
          employeeId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return {
        accountType: 'USER',
        ...faculty,
      }
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Faculty account already exists')
      }

      throw error
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id)

    const data: Prisma.UserUpdateInput = {}

    if (dto.name !== undefined) {
      data.name = dto.name
    }

    if (dto.email !== undefined) {
      data.email = this.normalizeEmail(dto.email)
    }

    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10)
    }

    if (dto.status !== undefined) {
      data.status = normalizeStatus(dto.status)
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    } catch (error: unknown) {
      this.handlePrismaError(error)
    }
  }

  async remove(id: string) {
    await this.ensureExists(id)

    try {
      return await this.prisma.user.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    } catch (error: unknown) {
      this.handlePrismaError(error)
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    })
  }

  private validateAccountRules(dto: CreateUserDto): void {
    if (dto.role === Role.SUPER_ADMIN) {
      if (!dto.email) {
        throw new BadRequestException('Email is required for SUPER_ADMIN')
      }

      if (dto.employeeId) {
        throw new BadRequestException(
          'employeeId is not allowed for SUPER_ADMIN',
        )
      }

      return
    }

    if (dto.role === Role.USER) {
      if (!dto.employeeId) {
        throw new BadRequestException('employeeId is required for USER')
      }

      if (dto.email) {
        throw new BadRequestException('Email is not allowed for USER')
      }

      return
    }

    throw new BadRequestException('Invalid role provided')
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private normalizeEmployeeId(employeeId: string): string {
    return employeeId.trim().toUpperCase()
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.SUPER_ADMIN,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('SUPER_ADMIN account already exists')
      }

      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete this user because it is referenced by other records',
        )
      }
    }

    throw error
  }
}
