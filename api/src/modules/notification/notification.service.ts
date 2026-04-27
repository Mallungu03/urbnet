import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { EmailProvider } from './providers/email.provider';
import { PushProvider } from './providers/push.provider';
import { NotificationChannel } from '@/generated/enums';
import { ISendNotificationOption } from '@/shared/interfaces/send-notification-option.inteface';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: EmailProvider,
    private readonly pushProvider: PushProvider,
  ) {}

  async send(options: ISendNotificationOption) {
    if (options.channel.includes(NotificationChannel.in_app)) {
      await this.prisma.notification.create({
        data: {
          userId: options.userId,
          title: options.title,
          body: options.body,
          channel: 'in_app',
          reportId: options.reportId,
          alertZoneId: options.alertZoneId,
        },
      });
    }

    if (options.channel.includes(NotificationChannel.email) && options.email) {
      await this.emailProvider.send({
        to: options.email,
        subject: options.title,
        text: options.body,
        template: options.template,
        templateData: options.templateData,
      });
    }

    if (options.channel.includes(NotificationChannel.push)) {
      const device = await this.prisma.device.findFirst({
        where: { userId: options.userId },
      });

      if (!device || !device.pushToken) {
        return;
      }
      await this.pushProvider.sendPushNotification(
        device.pushToken,
        options.title,
        options.body,
      );
    }
  }
}
