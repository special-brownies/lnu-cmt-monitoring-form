import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CreateMaintenanceDto } from './dto/create-maintenance.dto'
import { MaintenanceService } from './maintenance.service'

type AuthenticatedRequest = {
  user: {
    id: string
  }
}

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.maintenanceService.findAll({
      search,
      status,
    })

    return { success: true, data }
  }

  @Post()
  async create(
    @Body() dto: CreateMaintenanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const data = await this.maintenanceService.create(dto, request.user.id)
    return { success: true, data }
  }

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const data = await this.maintenanceService.complete(id, request.user.id)
    return { success: true, data }
  }
}
