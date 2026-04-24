import { PrismaService } from '@/config/db/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FindManyAlertZonesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, query: { page?: number; limit?: number }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException();
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = { deactivatedAt: null };

    const { total, alertZone } = await this.prisma.$transaction(
      async (prisma) => {
        const total = await prisma.alertZone.count({ where });

        const alertZone = await prisma.alertZone.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            reportId: true,
            createdAt: true,
            totalNotified: true,
          },
        });

        return { total, alertZone };
      },
    );

    return {
      data: alertZone.map((alertZone) => ({
        id: alertZone.id,
        reportId: alertZone.reportId,
        createdAt: alertZone.createdAt,
        totalNotified: alertZone.totalNotified,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
