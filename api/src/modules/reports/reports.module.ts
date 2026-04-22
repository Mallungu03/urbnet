import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CreateReportUseCase } from './use-cases/create-report.usecase';
import { DeleteReportUseCase } from './use-cases/delete-report.use-case';
import { FindUniqueReportUseCase } from './use-cases/find-unique-report.use-case';
import { FindManyReportsUseCase } from './use-cases/find-many-reports.use-case';
import { ConfirmReportUseCase } from './use-cases/confirm-report.use-case';
@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    CreateReportUseCase,
    DeleteReportUseCase,
    FindUniqueReportUseCase,
    FindManyReportsUseCase,
    ConfirmReportUseCase,
  ],
})
export class ReportsModule {}
