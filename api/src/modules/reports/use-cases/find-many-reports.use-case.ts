import { PrismaService } from '@/config/db/prisma.service';
import { FindManyQuery } from '@/shared/queries/find-many.query';
import { Injectable } from '@nestjs/common';
import { UploadService } from '@/modules/upload/upload.service';

@Injectable()
export class FindManyReportsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async execute(query: FindManyQuery) {
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
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarSeed: true,
                avatarKey: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                colorHex: true,
                isRisk: true,
              },
            },
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

    const reportsWithLocation = await Promise.all(
      reports.map(async (report) => {
        const [location] = await this.prisma.$queryRaw<
          Array<{ latitude: number; longitude: number }>
        >`
          SELECT
            ST_Y("location")::double precision AS "latitude",
            ST_X("location")::double precision AS "longitude"
          FROM "Report"
          WHERE "id" = ${report.id}
          LIMIT 1
        `;

        return {
          ...report,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
        };
      }),
    );

    return {
      data: reportsWithLocation.map((report) => ({
        id: report.id,
        confirmations: report.totalConfirmations,
        categoryId: report.categoryId,
        category: report.category,
        user: report.user,
        latitude: report.latitude,
        longitude: report.longitude,
        image: report.media[0]
          ? {
              key: report.media[0].s3Key,
              url: this.uploadService.getPublicUrl(report.media[0].s3Key),
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
