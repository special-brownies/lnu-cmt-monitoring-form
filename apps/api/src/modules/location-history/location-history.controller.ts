import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CreateLocationDto } from './dto/create-location.dto'
import { LocationHistoryService } from './location-history.service'

type AuthenticatedRequest = {
  user: {
    id: string
    role: Role
  }
}

@Controller('location-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationHistoryController {
  constructor(private readonly service: LocationHistoryService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: CreateLocationDto) {
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
