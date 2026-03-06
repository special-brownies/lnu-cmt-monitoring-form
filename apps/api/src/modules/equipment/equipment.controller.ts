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
  Req,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CreateEquipmentDto } from './dto/create-equipment.dto'
import { UpdateEquipmentDto } from './dto/update-equipment.dto'
import { EquipmentService } from './equipment.service'

type AuthenticatedRequest = {
  user: {
    id: string
    role: Role
    name?: string
    employeeId?: string
  }
}

@Controller(['equipment', 'equipments'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: CreateEquipmentDto) {
    const data = await this.service.create(dto)
    return { success: true, data }
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Req() request?: AuthenticatedRequest,
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
    }, request?.user)
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
    @Req() request?: AuthenticatedRequest,
  ) {
    const data = await this.service.findTimeline(id, range, request?.user)
    return { success: true, data }
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request?: AuthenticatedRequest,
  ) {
    const data = await this.service.findOne(id, request?.user)
    return { success: true, data }
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
  ) {
    const data = await this.service.update(id, dto)
    return { success: true, data }
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  async replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto,
  ) {
    const data = await this.service.update(id, dto)
    return { success: true, data }
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.remove(id)
    return { success: true, data }
  }
}
