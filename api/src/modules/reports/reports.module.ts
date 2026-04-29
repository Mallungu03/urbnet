import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { CreateReportUseCase } from './use-cases/create-report.usecase';
import { DeleteReportUseCase } from './use-cases/delete-report.use-case';
import { FindUniqueReportUseCase } from './use-cases/find-unique-report.use-case';
import { FindManyReportsUseCase } from './use-cases/find-many-reports.use-case';
import { ConfirmReportUseCase } from './use-cases/confirm-report.use-case';
import { UpdateReportUseCase } from './use-cases/update-report.use-case';
import { ReportListener } from './listeners/report.listener';
import { FindManyAlertZonesUseCase } from './use-cases/find-many-alert-zones.use-case';
import { FindUniqueAlertZoneUseCase } from './use-cases/find-unique-alert-zones.use-case';
import { CreateProximityAlertUseCase } from './use-cases/create-proximity-alert.use-case';
import { AlertsService } from './reports.service';
import { CloudinaryModule } from '../upload/cloudnary.module';
@Module({
  imports: [CloudinaryModule],
  controllers: [ReportsController],
  providers: [
    CreateReportUseCase,
    UpdateReportUseCase,
    DeleteReportUseCase,
    FindUniqueReportUseCase,
    FindManyReportsUseCase,
    ConfirmReportUseCase,
    ReportListener,
    FindManyAlertZonesUseCase,
    FindUniqueAlertZoneUseCase,
    CreateProximityAlertUseCase,
    AlertsService,
  ],
})
export class ReportsModule {}
