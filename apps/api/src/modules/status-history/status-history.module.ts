import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { EquipmentModule } from '../equipment/equipment.module'
import { StatusHistoryController } from './status-history.controller'
import { StatusHistoryService } from './status-history.service'

@Module({
  imports: [PrismaModule, EquipmentModule],
  controllers: [StatusHistoryController],
  providers: [StatusHistoryService],
})
export class StatusHistoryModule {}
