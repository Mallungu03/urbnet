import { AuditLogService } from '@/shared/audit/audit-log.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DeleteUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, id: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException();
    }
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) {
      throw new NotFoundException();
    }

    await this.prisma.notification.delete({
      where: { id, userId: user.id },
    });

    await this.auditLog.create({
      action: 'notification_deleted',
      entityType: 'notification',
      entityId: notification.id,
      actorId: user.id,
      message: 'Notificacao removida.',
      payload: {
        channel: notification.channel,
      },
    });
  }
}
