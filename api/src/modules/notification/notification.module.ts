import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailProvider } from './providers/email.provider';
import { AuthListener } from './listeners/auth.listener';
import { UserListener } from './listeners/users.listener';
import { MarkAllReadUseCase } from './use-cases/mark-all-read';
import { MarkReadUseCase } from './use-cases/mark-read.use-case';
import { GetManyUseCase } from './use-cases/get-many.use-case';
import { FindUniqueUseCase } from './use-cases/find-unique.use-case';
import { DeleteUseCase } from './use-cases/delete.use-case';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailProvider,
    AuthListener,
    UserListener,
    MarkAllReadUseCase,
    MarkReadUseCase,
    GetManyUseCase,
    FindUniqueUseCase,
    DeleteUseCase,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
