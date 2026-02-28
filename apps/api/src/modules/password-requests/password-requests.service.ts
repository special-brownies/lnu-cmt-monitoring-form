import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ResetStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PasswordRequestsService {
  private readonly logger = new Logger(PasswordRequestsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async create(employeeId: string) {
    const normalizedEmployeeId = employeeId.trim().toUpperCase()
    const faculty = await this.prisma.faculty.findUnique({
      where: { employeeId: normalizedEmployeeId },
      select: { id: true },
    })

    if (faculty) {
      const pendingRequest = await this.prisma.passwordResetRequest.findFirst({
        where: {
          facultyId: faculty.id,
          status: ResetStatus.PENDING,
        },
        select: { id: true },
      })

      if (!pendingRequest) {
        await this.prisma.passwordResetRequest.create({
          data: {
            facultyId: faculty.id,
            status: ResetStatus.PENDING,
          },
        })
      }
    }

    return {
      message: 'If an account exists, a request has been submitted',
    }
  }

  async findAll() {
    return this.prisma.passwordResetRequest.findMany({
      orderBy: { requestedAt: 'desc' },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        resolvedByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async resolve(requestId: string, newPassword: string, adminId: string) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: {
        faculty: {
          select: { id: true, employeeId: true, name: true },
        },
      },
    })

    if (!request) {
      throw new NotFoundException('Password reset request not found')
    }

    if (request.status !== ResetStatus.PENDING) {
      throw new BadRequestException('Password reset request is already completed')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const resolved = await this.prisma.$transaction(async (tx) => {
      await tx.faculty.update({
        where: { id: request.facultyId },
        data: { password: hashedPassword },
      })

      return tx.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: ResetStatus.COMPLETED,
          resolvedAt: new Date(),
          resolvedBy: adminId,
        },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
          resolvedByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    })

    this.logger.log(
      `Password request ${requestId} resolved by admin ${adminId} for faculty ${request.faculty.employeeId}`,
    )

    return resolved
  }
}
