import { AuditLogService } from '@/shared/audit/audit-log.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FindUniqueUseCase {
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

    await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), isRead: true },
    });

    await this.auditLog.create({
      action: 'notification_read',
      entityType: 'notification',
      entityId: notification.id,
      actorId: user.id,
      message: 'Notificacao lida.',
      payload: {
        channel: notification.channel,
      },
    });

    return notification;
  }
}
