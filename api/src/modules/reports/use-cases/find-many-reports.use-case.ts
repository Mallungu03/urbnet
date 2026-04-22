import { PrismaService } from '@/shared/prisma/prisma.service';
import { FindManyQueryDto } from '@/shared/queries/find-many.query';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FindManyReportsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindManyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { content: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const { total, reports } = await this.prisma.$transaction(
      async (prisma) => {
        const total = await prisma.report.count({ where });
        const reports = await prisma.report.findMany({
          where,
          skip,
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            content: true,
            id: true,
            createdAt: true,
            totalConfirmations: true,
            userId: true,
            categoryId: true,
          },
        });

        return { total, reports };
      },
    );

    return {
      data: reports.map((report) => ({
        id: report.id,
        confirmations: report.totalConfirmations,
        categoryId: report.categoryId,
        createdAt: report.createdAt,
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
