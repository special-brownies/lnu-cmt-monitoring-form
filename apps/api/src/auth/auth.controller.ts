import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'
import { AuthService } from './auth.service'
import { AdminLoginDto } from './dto/admin-login.dto'
import { FacultyLoginDto } from './dto/faculty-login.dto'

type AuthenticatedRequest = {
  user: {
    id: string
    role: 'SUPER_ADMIN' | 'USER'
    name: string
    email?: string
    employeeId?: string
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
    return {
      success: true,
      data: request.user,
    }
  }
}
