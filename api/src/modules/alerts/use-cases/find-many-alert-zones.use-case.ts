import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FindManyAlertZonesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(publicId: string, query: { page?: number; limit?: number }) {
    const user = await this.prisma.user.findUnique({ where: { publicId } });
    if (!user) {
      throw new NotFoundException();
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = { deactivatedAt: null, publicId };

    const { total, alertZone } = await this.prisma.$transaction(
      async (prisma) => {
        const total = await prisma.alertZone.count({ where });

        const alertZone = await prisma.alertZone.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            publicId: true,
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
        id: alertZone.publicId,
        reportId: async () => {
          const report = await this.prisma.report.findUnique({
            where: { id: alertZone.reportId },
          });
          return report?.publicId;
        },
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
