import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { AdminLoginDto } from './dto/admin-login.dto'
import { FacultyLoginDto } from './dto/faculty-login.dto'

const INACTIVE_ACCOUNT_MESSAGE =
  'Your account is currently marked as Inactive, please contact the CMT Head to reactivate your account.'

type AuthPrincipal = {
  id: string
  role: Role
  email?: string
  employeeId?: string
  name: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(dto: AdminLoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user || user.role !== Role.SUPER_ADMIN) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return this.signToken({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    })
  }

  async loginFaculty(dto: FacultyLoginDto) {
    const employeeId = dto.employeeId.trim().toUpperCase()
    const faculty = await this.prisma.faculty.findUnique({
      where: { employeeId },
    })

    if (!faculty) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, faculty.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (faculty.status.trim().toUpperCase() === 'INACTIVE') {
      throw new UnauthorizedException(INACTIVE_ACCOUNT_MESSAGE)
    }

    return this.signToken({
      id: faculty.id,
      role: Role.USER,
      employeeId: faculty.employeeId,
      name: faculty.name,
    })
  }

  private async signToken(principal: AuthPrincipal) {
    const payload = {
      sub: principal.id,
      role: principal.role,
      name: principal.name,
      email: principal.email,
      employeeId: principal.employeeId,
    }

    return {
      access_token: await this.jwtService.signAsync(payload),
      role: principal.role,
    }
  }
}
