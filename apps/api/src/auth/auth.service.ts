import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { mkdir, unlink, writeFile } from 'fs/promises'
import { basename, join } from 'path'
import { PrismaService } from '../prisma/prisma.service'
import { AdminLoginDto } from './dto/admin-login.dto'
import { FacultyLoginDto } from './dto/faculty-login.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

const INACTIVE_ACCOUNT_MESSAGE =
  'Your account is currently marked as Inactive, please contact the CMT Head to reactivate your account.'

type AuthPrincipal = {
  id: string
  role: Role
  email?: string
  employeeId?: string
  name: string
  profileImagePath?: string | null
  createdAt?: Date
}

type ProfileImageFile = {
  buffer: Buffer
  mimetype: string
  size: number
}

type CurrentProfile = {
  id: string
  role: Role
  name: string
  email?: string
  employeeId?: string
  profileImagePath?: string | null
  createdAt: Date
}

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024
const PROFILE_IMAGE_PUBLIC_PREFIX = '/uploads/profile-images/'

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

    if (user.status.trim().toUpperCase() === 'INACTIVE') {
      throw new UnauthorizedException(INACTIVE_ACCOUNT_MESSAGE)
    }

    return this.signToken({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      profileImagePath: user.profileImagePath,
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
      profileImagePath: faculty.profileImagePath,
    })
  }

  async getCurrentProfile(principal: Pick<AuthPrincipal, 'id' | 'role'>) {
    if (principal.role === Role.SUPER_ADMIN) {
      const user = await this.prisma.user.findFirst({
        where: { id: principal.id, role: Role.SUPER_ADMIN },
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
          profileImagePath: true,
          createdAt: true,
        },
      })

      if (!user) {
        throw new NotFoundException('User profile not found')
      }

      return user satisfies CurrentProfile
    }

    const faculty = await this.prisma.faculty.findUnique({
      where: { id: principal.id },
      select: {
        id: true,
        name: true,
        employeeId: true,
        profileImagePath: true,
        createdAt: true,
      },
    })

    if (!faculty) {
      throw new NotFoundException('User profile not found')
    }

    return {
      ...faculty,
      role: Role.USER,
    } satisfies CurrentProfile
  }

  async updateCurrentProfile(
    principal: Pick<AuthPrincipal, 'id' | 'role'>,
    dto: UpdateProfileDto,
  ) {
    if (principal.role === Role.SUPER_ADMIN) {
      const data: Prisma.UserUpdateInput = {}

      if (dto.name !== undefined) {
        data.name = this.normalizeName(dto.name)
      }

      if (dto.email !== undefined) {
        data.email = this.normalizeEmail(dto.email)
      }

      if (Object.keys(data).length === 0) {
        return this.getCurrentProfile(principal)
      }

      try {
        const user = await this.prisma.user.update({
          where: { id: principal.id },
          data,
          select: {
            id: true,
            role: true,
            name: true,
            email: true,
            profileImagePath: true,
            createdAt: true,
          },
        })

        return user satisfies CurrentProfile
      } catch (error: unknown) {
        this.handleProfilePrismaError(error)
      }
    }

    if (dto.email !== undefined) {
      throw new BadRequestException('Email cannot be updated for USER accounts')
    }

    const data: Prisma.FacultyUpdateInput = {}

    if (dto.name !== undefined) {
      data.name = this.normalizeName(dto.name)
    }

    if (Object.keys(data).length === 0) {
      return this.getCurrentProfile(principal)
    }

    try {
      const faculty = await this.prisma.faculty.update({
        where: { id: principal.id },
        data,
        select: {
          id: true,
          name: true,
          employeeId: true,
          profileImagePath: true,
          createdAt: true,
        },
      })

      return {
        ...faculty,
        role: Role.USER,
      } satisfies CurrentProfile
    } catch (error: unknown) {
      this.handleProfilePrismaError(error)
    }
  }

  async updateCurrentProfileImage(
    principal: Pick<AuthPrincipal, 'id' | 'role'>,
    file?: ProfileImageFile | null,
  ) {
    if (!file || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException('Profile image file is required')
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      throw new BadRequestException('Profile image must be 2MB or smaller')
    }

    const extension = this.resolveImageExtension(file.mimetype)

    if (!extension) {
      throw new BadRequestException(
        'Only PNG, JPG, JPEG, and WEBP images are supported',
      )
    }

    if (!this.isValidImageBuffer(file.buffer, extension)) {
      throw new BadRequestException('Uploaded file is not a valid image')
    }

    const filename = `${principal.role.toLowerCase()}-${principal.id}-${Date.now()}-${randomUUID()}.${extension}`
    const directory = this.getProfileImageDirectory()
    const absolutePath = join(directory, filename)
    const nextProfileImagePath = `${PROFILE_IMAGE_PUBLIC_PREFIX}${filename}`

    await mkdir(directory, { recursive: true })
    await writeFile(absolutePath, file.buffer)

    try {
      if (principal.role === Role.SUPER_ADMIN) {
        const existingUser = await this.prisma.user.findFirst({
          where: { id: principal.id, role: Role.SUPER_ADMIN },
          select: { profileImagePath: true },
        })

        if (!existingUser) {
          throw new NotFoundException('User profile not found')
        }

        const updatedUser = await this.prisma.user.update({
          where: { id: principal.id },
          data: {
            profileImagePath: nextProfileImagePath,
          },
          select: {
            id: true,
            role: true,
            name: true,
            email: true,
            profileImagePath: true,
            createdAt: true,
          },
        })

        await this.deleteManagedProfileImage(existingUser.profileImagePath)

        return updatedUser satisfies CurrentProfile
      }

      const existingFaculty = await this.prisma.faculty.findUnique({
        where: { id: principal.id },
        select: { profileImagePath: true },
      })

      if (!existingFaculty) {
        throw new NotFoundException('User profile not found')
      }

      const updatedFaculty = await this.prisma.faculty.update({
        where: { id: principal.id },
        data: {
          profileImagePath: nextProfileImagePath,
        },
        select: {
          id: true,
          name: true,
          employeeId: true,
          profileImagePath: true,
          createdAt: true,
        },
      })

      await this.deleteManagedProfileImage(existingFaculty.profileImagePath)

      return {
        ...updatedFaculty,
        role: Role.USER,
      } satisfies CurrentProfile
    } catch (error: unknown) {
      try {
        await unlink(absolutePath)
      } catch {
        // Best effort cleanup of failed upload writes.
      }

      throw error
    }
  }

  private async signToken(principal: AuthPrincipal) {
    const payload = {
      sub: principal.id,
      role: principal.role,
      name: principal.name,
      email: principal.email,
      employeeId: principal.employeeId,
      profileImagePath: principal.profileImagePath,
    }

    return {
      access_token: await this.jwtService.signAsync(payload),
      role: principal.role,
    }
  }

  private normalizeName(name: string) {
    const normalizedName = name.trim()

    if (normalizedName.length < 2) {
      throw new BadRequestException('Name must be at least 2 characters')
    }

    return normalizedName
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private resolveImageExtension(mimetype: string) {
    const normalized = mimetype.trim().toLowerCase()

    if (normalized === 'image/png') {
      return 'png'
    }

    if (normalized === 'image/jpeg' || normalized === 'image/jpg') {
      return 'jpg'
    }

    if (normalized === 'image/webp') {
      return 'webp'
    }

    return null
  }

  private isValidImageBuffer(buffer: Buffer, extension: string) {
    if (extension === 'png') {
      if (buffer.length < 8) {
        return false
      }

      const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      return pngSignature.every((byte, index) => buffer[index] === byte)
    }

    if (extension === 'jpg') {
      if (buffer.length < 4) {
        return false
      }

      return (
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[buffer.length - 2] === 0xff &&
        buffer[buffer.length - 1] === 0xd9
      )
    }

    if (extension === 'webp') {
      if (buffer.length < 12) {
        return false
      }

      const riff = buffer.toString('ascii', 0, 4)
      const webp = buffer.toString('ascii', 8, 12)
      return riff === 'RIFF' && webp === 'WEBP'
    }

    return false
  }

  private getProfileImageDirectory() {
    return join(process.cwd(), 'uploads', 'profile-images')
  }

  private async deleteManagedProfileImage(currentPath?: string | null) {
    if (!currentPath || !currentPath.startsWith(PROFILE_IMAGE_PUBLIC_PREFIX)) {
      return
    }

    const currentFilename = basename(currentPath)
    const absolutePath = join(this.getProfileImageDirectory(), currentFilename)

    try {
      await unlink(absolutePath)
    } catch {
      // Ignore missing files in cleanup.
    }
  }

  private handleProfilePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A user with the same unique value already exists')
      }
    }

    throw error
  }
}
