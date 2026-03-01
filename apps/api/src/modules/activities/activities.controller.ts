import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ActivitiesService } from './activities.service'

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('recent')
  async getRecent() {
    const data = await this.activitiesService.getRecent()
    return { success: true, data }
  }
}
