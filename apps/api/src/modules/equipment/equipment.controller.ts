import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { CreateEquipmentDto } from './dto/create-equipment.dto'
import { UpdateEquipmentDto } from './dto/update-equipment.dto'
import { EquipmentService } from './equipment.service'

@Controller(['equipment', 'equipments'])
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  @Post()
  async create(@Body() dto: CreateEquipmentDto) {
    const data = await this.service.create(dto)
    return { success: true, data }
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const parsedCategoryId =
      categoryId && categoryId.length > 0
        ? Number.parseInt(categoryId, 10)
        : undefined

    if (categoryId && Number.isNaN(parsedCategoryId)) {
      throw new BadRequestException('categoryId must be a valid number')
    }

    const data = await this.service.findAll({
      search,
      status,
      categoryId: parsedCategoryId,
    })
    return { success: true, data }
  }

  @Get('summary')
  async findSummary() {
    const data = await this.service.findSummary()
    return { success: true, data }
  }

  @Get(':id/timeline')
  async findTimeline(
    @Param('id', ParseIntPipe) id: number,
    @Query('range') range?: string,
  ) {
    const data = await this.service.findTimeline(id, range)
    return { success: true, data }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.findOne(id)
    return { success: true, data }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
  ) {
    const data = await this.service.update(id, dto)
    return { success: true, data }
  }

  @Put(':id')
  async replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
  ) {
    const data = await this.service.update(id, dto)
    return { success: true, data }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.remove(id)
    return { success: true, data }
  }
}
