import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        employeeId: true,
        createdAt: true,
      },
    })
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async create(dto: CreateUserDto) {
    const employeeId = this.normalizeEmail(dto.email)
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    try {
      return await this.prisma.user.create({
        data: {
          employeeId,
          passwordHash: hashedPassword,
        },
      })
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists')
      }

      throw error
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { employeeId: this.normalizeEmail(email) },
    })
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }
}
