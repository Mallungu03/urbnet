import { PrismaService } from '@/shared/prisma/prisma.service';
import { FindManyQueryDto } from '@/shared/queries/find-many.query';
import { Injectable } from '@nestjs/common';
import { ReportMediaStorageService } from '../services/report-media-storage.service';

@Injectable()
export class FindManyReportsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportMediaStorage: ReportMediaStorageService,
  ) {}

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
            media: {
              orderBy: { createdAt: 'asc' },
              take: 1,
              select: {
                s3Key: true,
                mimeType: true,
                fileSizeKb: true,
                widthPx: true,
                heightPx: true,
              },
            },
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
        image: report.media[0]
          ? {
              key: report.media[0].s3Key,
              url: this.reportMediaStorage.getPublicUrl(report.media[0].s3Key),
              mimeType: report.media[0].mimeType,
              fileSizeKb: report.media[0].fileSizeKb,
              widthPx: report.media[0].widthPx,
              heightPx: report.media[0].heightPx,
            }
          : null,
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
