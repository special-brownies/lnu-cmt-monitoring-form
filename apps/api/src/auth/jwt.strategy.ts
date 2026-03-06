import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Role } from '@prisma/client'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { PrismaService } from '../prisma/prisma.service'

type JwtPayload = {
  sub: string
  role: Role
  email?: string
  employeeId?: string
  name?: string
  profileImagePath?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret',
    })
  }

  async validate(payload: JwtPayload) {
    if (payload.role === Role.SUPER_ADMIN) {
      const admin = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          profileImagePath: true,
          createdAt: true,
        },
      })

      if (!admin) {
        throw new UnauthorizedException('Invalid token')
      }

      if (admin.status.trim().toUpperCase() === 'INACTIVE') {
        throw new UnauthorizedException('Invalid token')
      }

      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        profileImagePath: admin.profileImagePath,
        createdAt: admin.createdAt,
      }
    }

    if (payload.role === Role.USER) {
      const faculty = await this.prisma.faculty.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          name: true,
          employeeId: true,
          profileImagePath: true,
          createdAt: true,
        },
      })

      if (!faculty) {
        throw new UnauthorizedException('Invalid token')
      }

      return {
        id: faculty.id,
        name: faculty.name,
        employeeId: faculty.employeeId,
        role: Role.USER,
        profileImagePath: faculty.profileImagePath,
        createdAt: faculty.createdAt,
      }
    }

    throw new UnauthorizedException('Invalid token')
  }
}
