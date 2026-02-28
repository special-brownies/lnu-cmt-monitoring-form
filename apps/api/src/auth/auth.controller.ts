import { Body, Controller, Post } from '@nestjs/common'
import { CreateUserDto } from '../modules/user/dto/create-user.dto'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const data = await this.authService.register(dto)
    return { success: true, data }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.loginWithCredentials(dto)
    return data
  }
}
