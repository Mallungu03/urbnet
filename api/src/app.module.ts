import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthGuard } from './shared/guards/auth.guard';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { EnvModule } from './config/env/env.module';
import { PrismaModule } from './config/db/prisma.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { EnvService } from './config/env/env.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({ global: true }),
    ThrottlerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        throttlers: [
          {
            limit: env.rateLimit,
            ttl: env.rateTtl,
            blockDuration: env.rateBlockDuration,
          },
        ],
      }),
    }),
    PrismaModule,
    AdminModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    EnvModule,
    NotificationModule,
    AlertsModule,
  ],
  providers: [{ provide: 'APP_GUARD', useClass: AuthGuard }],
})
export class AppModule {}
