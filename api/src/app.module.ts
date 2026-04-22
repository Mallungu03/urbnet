import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthGuard } from './shared/guards/auth.guard';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { PrismaModule } from './config/db/prisma.module';
import { EnvModule } from './config/env/env.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ global: true }),
    PrismaModule,
    AdminModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    EnvModule,
    NotificationModule,
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: 'APP_GUARD', useClass: AuthGuard }],
})
export class AppModule {}
