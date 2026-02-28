import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CreatePasswordRequestDto } from './dto/create-password-request.dto'
import { ResolvePasswordRequestDto } from './dto/resolve-password-request.dto'
import { PasswordRequestsService } from './password-requests.service'

type AuthenticatedRequest = {
  user: {
    id: string
  }
}

@Controller('password-requests')
export class PasswordRequestsController {
  constructor(private readonly service: PasswordRequestsService) {}

  @Post()
  async create(@Body() dto: CreatePasswordRequestDto) {
    const data = await this.service.create(dto.employeeId)
    return { success: true, data }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findAll() {
    const data = await this.service.findAll()
    return { success: true, data }
  }

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolvePasswordRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const data = await this.service.resolve(id, dto.newPassword, request.user.id)
    return { success: true, data }
  }
}
