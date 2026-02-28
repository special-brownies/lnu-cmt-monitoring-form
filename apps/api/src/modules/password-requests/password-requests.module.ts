import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { PasswordRequestsController } from './password-requests.controller'
import { PasswordRequestsService } from './password-requests.service'

@Module({
  imports: [PrismaModule],
  controllers: [PasswordRequestsController],
  providers: [PasswordRequestsService],
  exports: [PasswordRequestsService],
})
export class PasswordRequestsModule {}
