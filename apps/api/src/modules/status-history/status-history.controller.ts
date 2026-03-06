import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CreateStatusDto } from './dto/create-status.dto'
import { StatusHistoryService } from './status-history.service'

type AuthenticatedRequest = {
  user: {
    id: string
    role: Role
  }
}

@Controller('status-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatusHistoryController {
  constructor(private readonly service: StatusHistoryService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: CreateStatusDto) {
    const data = await this.service.create(dto)
    return { success: true, data }
  }

  @Get('equipment/:equipmentId')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  async findByEquipment(
    @Param('equipmentId', ParseIntPipe) equipmentId: number,
    @Req() request?: AuthenticatedRequest,
  ) {
    const data = await this.service.findByEquipment(equipmentId, request?.user)
    return { success: true, data }
  }
}
