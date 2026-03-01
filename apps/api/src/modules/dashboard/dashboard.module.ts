import { Module } from '@nestjs/common'
import { EquipmentModule } from '../equipment/equipment.module'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({
  imports: [EquipmentModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
