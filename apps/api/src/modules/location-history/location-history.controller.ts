import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common'
import { CreateLocationDto } from './dto/create-location.dto'
import { LocationHistoryService } from './location-history.service'

@Controller('location-history')
export class LocationHistoryController {
  constructor(private readonly service: LocationHistoryService) {}

  @Post()
  async create(@Body() dto: CreateLocationDto) {
    const data = await this.service.create(dto)
    return { success: true, data }
  }

  @Get('equipment/:equipmentId')
  async findByEquipment(
    @Param('equipmentId', ParseIntPipe) equipmentId: number,
  ) {
    const data = await this.service.findByEquipment(equipmentId)
    return { success: true, data }
  }
}
