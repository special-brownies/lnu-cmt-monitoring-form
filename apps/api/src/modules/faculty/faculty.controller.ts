import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { FacultyService } from './faculty.service'
import { CreateFacultyDto } from './dto/create-faculty.dto'
import { UpdateFacultyDto } from './dto/update-faculty.dto'

@Controller(['faculty', 'faculties'])
@UseGuards(JwtAuthGuard)
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.findOne(id)
    return { success: true, data }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFacultyDto,
  ) {
    const data = await this.service.update(id, dto)
    return { success: true, data }
  }

  @Put(':id')
  async replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFacultyDto,
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
