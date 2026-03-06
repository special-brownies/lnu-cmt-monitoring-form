import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CreateRoomDto } from './dto/create-room.dto'
import { UpdateRoomDto } from './dto/update-room.dto'
import { RoomService } from './room.service'

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomController {
  constructor(private readonly service: RoomService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: CreateRoomDto) {
    const data = await this.service.create(dto)
    return { success: true, data }
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  async findAll() {
    const data = await this.service.findAll()
    return { success: true, data }
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.findOne(id)
    return { success: true, data }
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomDto,
  ) {
    const data = await this.service.update(id, dto)
    return { success: true, data }
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.remove(id)
    return { success: true, data }
  }
}
