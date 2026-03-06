import { Controller, Get, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { DashboardService } from './dashboard.service'

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    const data = await this.dashboardService.getStats()
    return { success: true, data }
  }

  @Get('analytics')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  async getAnalytics() {
    const data = await this.dashboardService.getAnalytics()
    return { success: true, data }
  }
}
