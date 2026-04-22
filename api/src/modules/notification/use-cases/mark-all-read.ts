import { AuditLogService } from '@/shared/audit/audit-log.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class MarkAllReadUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException();
    }

    const updatedNotifications = await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date(), isRead: true },
    });

    await this.auditLog.create({
      action: 'notifications_marked_read',
      entityType: 'notification',
      entityId: user.id,
      actorId: user.id,
      message: 'Todas notificacoes lidas.',
      payload: {
        total: updatedNotifications.count,
      },
    });

    return { message: 'All messages marked as read' };
  }
}
