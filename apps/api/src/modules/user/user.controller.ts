import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CreateUserDto } from './dto/create-user.dto'
import { UserService } from './user.service'

@Controller(['user', 'users'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const data = await this.userService.create(dto)
    return { success: true, data }
  }

  @Get()
  async findAll() {
    const data = await this.userService.findAll()
    return { success: true, data }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.userService.findOne(id)
    return { success: true, data }
  }
}
