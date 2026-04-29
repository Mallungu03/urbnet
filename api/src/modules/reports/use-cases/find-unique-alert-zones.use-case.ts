import { PrismaService } from '@/config/db/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FindUniqueAlertZoneUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException();
    }

    const alertZone = await this.prisma.alertZone.findFirst({
      where: { id, deactivatedAt: null },
    });

    if (!alertZone) {
      throw new NotFoundException('Alerta não encontrado.');
    }

    return {
      id: alertZone.id,
      reportId: alertZone.reportId,
      createdAt: alertZone.createdAt,
      totalNotified: alertZone.totalNotified,
    };
  }
}
