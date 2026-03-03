import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
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

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const data = await this.userService.update(id, dto)
    return { success: true, data }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.userService.remove(id)
    return { success: true, data }
  }
}
