import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common'
import { CreateStatusDto } from './dto/create-status.dto'
import { StatusHistoryService } from './status-history.service'

@Controller('status-history')
export class StatusHistoryController {
  constructor(private readonly service: StatusHistoryService) {}

  @Post()
  async create(@Body() dto: CreateStatusDto) {
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
