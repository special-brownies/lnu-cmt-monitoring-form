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
    role: Role
    name?: string
    employeeId?: string
  }
}

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Req() request?: AuthenticatedRequest,
  ) {
    const data = await this.maintenanceService.findAll({
      search,
      status,
    }, request?.user)

    return { success: true, data }
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  async create(
    @Body() dto: CreateMaintenanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const data = await this.maintenanceService.create(dto, request.user)
    return { success: true, data }
  }

  @Post(':id/complete')
  @Roles(Role.SUPER_ADMIN)
  async complete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const data = await this.maintenanceService.complete(id, request.user.id)
    return { success: true, data }
  }
}
