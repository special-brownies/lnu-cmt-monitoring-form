import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from './jwt-auth.guard'
import { AuthService } from './auth.service'
import { AdminLoginDto } from './dto/admin-login.dto'
import { FacultyLoginDto } from './dto/faculty-login.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

type AuthenticatedRequest = {
  user: {
    id: string
    role: 'SUPER_ADMIN' | 'USER'
    name: string
    email?: string
    employeeId?: string
    profileImagePath?: string | null
    createdAt: Date
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/admin')
  async loginAdmin(@Body() dto: AdminLoginDto) {
    const data = await this.authService.loginAdmin(dto)
    return data
  }

  @Post('login/faculty')
  async loginFaculty(@Body() dto: FacultyLoginDto) {
    const data = await this.authService.loginFaculty(dto)
    return data
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: AuthenticatedRequest) {
    const data = await this.authService.getCurrentProfile(request.user)

    return {
      success: true,
      data,
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.authService.updateCurrentProfile(request.user, dto)
    return { success: true, data }
  }

  @Post('me/profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  async updateProfileImage(
    @Req() request: AuthenticatedRequest,
    @UploadedFile()
    file?: {
      buffer: Buffer
      mimetype: string
      size: number
    },
  ) {
    const data = await this.authService.updateCurrentProfileImage(
      request.user,
      file,
    )

    return { success: true, data }
  }
}
