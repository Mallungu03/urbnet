import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

Injectable();
export class FindUniqueAlertZoneUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(publicId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { publicId } });

    if (!user) {
      throw new NotFoundException();
    }

    const alertZone = await this.prisma.alertZone.findFirst({
      where: { publicId: id, deactivatedAt: null },
    });

    if (!alertZone) {
      throw new NotFoundException('Alerta não encontrado.');
    }

    const report = await this.prisma.report.findUnique({
      where: { id: alertZone.reportId },
    });

    return {
      id: alertZone.publicId,
      reportId: report?.publicId,
      createdAt: alertZone.createdAt,
      totalNotified: alertZone.totalNotified,
    };
  }
}
