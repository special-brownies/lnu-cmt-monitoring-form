import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AdminLoginDto } from './dto/admin-login.dto'
import { FacultyLoginDto } from './dto/faculty-login.dto'

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
}
