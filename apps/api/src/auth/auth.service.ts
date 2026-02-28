import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { CreateUserDto } from '../modules/user/dto/create-user.dto'
import { UserService } from '../modules/user/user.service'
import { LoginDto } from './dto/login.dto'

type AuthUser = {
  id: number
  employeeId: string
  createdAt: Date
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto)
    const { passwordHash, ...safeUser } = user

    return {
      ...safeUser,
      email: safeUser.employeeId,
      role: 'admin',
    }
  }

  async validateUser(email: string, password: string): Promise<AuthUser> {
    const user = await this.usersService.findByEmail(email)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { passwordHash, ...safeUser } = user
    return safeUser
  }

  async login(user: AuthUser) {
    const payload = {
      sub: user.id,
      email: user.employeeId,
      role: 'admin',
    }

    return {
      access_token: await this.jwtService.signAsync(payload),
    }
  }

  async loginWithCredentials(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password)
    return this.login(user)
  }
}
