import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { FindManyAlertZonesUseCase } from './use-cases/find-many-alert-zones.use-case';
import { FindUniqueAlertZoneUseCase } from './use-cases/find-unique-alert-zones.use-case';
import { ReportListener } from './listeners/report.listener';
import { CreateProximityAlertUseCase } from './use-cases/create-proximity-alert.use-case';
import { AlertsService } from './alerts.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [AlertsController],
  providers: [
    ReportListener,
    FindManyAlertZonesUseCase,
    FindUniqueAlertZoneUseCase,
    CreateProximityAlertUseCase,
    AlertsService,
  ],
})
export class AlertsModule {}
