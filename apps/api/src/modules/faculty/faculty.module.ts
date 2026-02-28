import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { FacultyController } from './faculty.controller'
import { FacultyService } from './faculty.service'

@Module({
  imports: [PrismaModule],
  controllers: [FacultyController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
