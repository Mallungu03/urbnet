import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportMediaStorageService } from '../services/report-media-storage.service';

@Injectable()
export class FindUniqueReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportMediaStorage: ReportMediaStorageService,
  ) {}

  async execute(id: string) {
    const report = await this.prisma.report.findFirst({
      where: { id, deletedAt: null },
      include: {
        media: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report não encontrado.');
    }

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

    const user = await this.prisma.user.findFirst({
      where: { id: report.userId, deletedAt: null, isBanned: false },
    });

    return {
      id: report.id,
      userId: user?.id,
      categoryId: report.categoryId,
      content: report.content,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
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
    };
  }
}
