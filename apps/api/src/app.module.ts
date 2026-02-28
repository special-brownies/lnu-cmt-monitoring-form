import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { RolesGuard } from './auth/roles.guard'
import { HealthController } from './health.controller'
import { CategoryModule } from './modules/category/category.module'
import { EquipmentModule } from './modules/equipment/equipment.module'
import { FacultyModule } from './modules/faculty/faculty.module'
import { LocationHistoryModule } from './modules/location-history/location-history.module'
import { PasswordRequestsModule } from './modules/password-requests/password-requests.module'
import { RoomModule } from './modules/room/room.module'
import { StatusHistoryModule } from './modules/status-history/status-history.module'
import { UserModule } from './modules/user/user.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CategoryModule,
    FacultyModule,
    RoomModule,
    EquipmentModule,
    StatusHistoryModule,
    LocationHistoryModule,
    PasswordRequestsModule,
    UserModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, RolesGuard],
})
export class AppModule {}
