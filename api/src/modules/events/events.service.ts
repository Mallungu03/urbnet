import { PrismaService } from '@/config/db/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async deleteOtpsExpired(): Promise<void> {
    await this.prisma.otp.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async desativadeAlertsOlderThan24Hours(): Promise<void> {
    await this.prisma.alertZone.updateMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        deactivatedAt: null,
      },
      data: {
        deactivatedAt: new Date(),
      },
    });
  }
}
