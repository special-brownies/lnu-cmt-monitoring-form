import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { EquipmentModule } from '../equipment/equipment.module'
import { RoomModule } from '../room/room.module'
import { LocationHistoryController } from './location-history.controller'
import { LocationHistoryService } from './location-history.service'

@Module({
  imports: [PrismaModule, EquipmentModule, RoomModule],
  controllers: [LocationHistoryController],
  providers: [LocationHistoryService],
})
export class LocationHistoryModule {}
