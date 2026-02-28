import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { FacultyService } from './faculty.service'
import { CreateFacultyDto } from './dto/create-faculty.dto'
import { UpdateFacultyDto } from './dto/update-faculty.dto'

@Controller(['faculty', 'faculties'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class FacultyController {
  constructor(private readonly service: FacultyService) {}

  @Post()
  async create(@Body() dto: CreateFacultyDto) {
    const data = await this.service.create(dto)
    return { success: true, data }
  }

  @Get()
  async findAll() {
    const data = await this.service.findAll()
    return { success: true, data }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id)
    return { success: true, data }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFacultyDto,
  ) {
    const data = await this.service.update(id, dto)
    return { success: true, data }
  }

  @Put(':id')
  async replace(
    @Param('id') id: string,
    @Body() dto: UpdateFacultyDto,
  ) {
    const data = await this.service.update(id, dto)
    return { success: true, data }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.service.remove(id)
    return { success: true, data }
  }
}
