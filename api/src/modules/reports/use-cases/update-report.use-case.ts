import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/config/db/prisma.service';
import { ReportMediaStorageService } from '../services/report-media-storage.service';
import { UpdateReportDto } from '../dto/update-report.dto';

@Injectable()
export class UpdateReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly reportMediaStorage: ReportMediaStorageService,
  ) {}

  async execute(
    userId: string,
    reportId: string,
    dto: UpdateReportDto,
    file?: Express.Multer.File,
  ) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, deletedAt: null },
      include: {
        category: {
          select: {
            id: true,
            isRisk: true,
          },
        },
        media: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report não encontrado.');
    }

    if (report.userId !== userId) {
      throw new ForbiddenException('Só podes atualizar o teu próprio report.');
    }

    const [currentLocation] = await this.prisma.$queryRaw<
      Array<{ latitude: number; longitude: number }>
    >`
      SELECT
        ST_Y("location")::double precision AS "latitude",
        ST_X("location")::double precision AS "longitude"
      FROM "Report"
      WHERE "id" = ${report.id}
      LIMIT 1
    `;

    if (!currentLocation) {
      throw new NotFoundException('Localização do report não encontrada.');
    }

    if (
      dto.categoryId === undefined &&
      dto.content === undefined &&
      dto.latitude === undefined &&
      dto.longitude === undefined &&
      !file?.buffer
    ) {
      throw new BadRequestException(
        'Pelo menos um campo deve ser informado para atualização.',
      );
    }

    const nextCategoryId =
      dto.categoryId !== undefined ? Number(dto.categoryId) : report.categoryId;
    const nextContent =
      dto.content !== undefined ? String(dto.content).trim() : report.content;
    const nextLatitude =
      dto.latitude !== undefined
        ? Number(dto.latitude)
        : Number(currentLocation.latitude);
    const nextLongitude =
      dto.longitude !== undefined
        ? Number(dto.longitude)
        : Number(currentLocation.longitude);

    const category = await this.prisma.category.findFirst({
      where: { id: nextCategoryId, isActive: true, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const changedFields: string[] = [];
    let nextFileKey: string | null = null;
    let previousFileKeyToDelete: string | null = null;
    let nextFileMetadata: {
      mimeType: string;
      fileSizeKb: number;
      widthPx: number | null;
      heightPx: number | null;
    } | null = null;

    if (dto.categoryId !== undefined && nextCategoryId !== report.categoryId) {
      changedFields.push('categoryId');
    }

    if (dto.content !== undefined && nextContent !== report.content) {
      changedFields.push('content');
    }

    if (nextLatitude !== Number(currentLocation.latitude)) {
      changedFields.push('latitude');
    }

    if (nextLongitude !== Number(currentLocation.longitude)) {
      changedFields.push('longitude');
    }

    if (file?.buffer) {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      const optimizedBuffer = await image
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      nextFileKey = `reports/${userId}/${randomUUID()}.jpg`;
      nextFileMetadata = {
        mimeType: 'image/jpeg',
        fileSizeKb: Math.ceil(optimizedBuffer.length / 1024),
        widthPx: metadata.width ?? null,
        heightPx: metadata.height ?? null,
      };

      await this.reportMediaStorage.saveReportImage(
        nextFileKey,
        optimizedBuffer,
      );
      previousFileKeyToDelete = report.media[0]?.s3Key ?? null;
      changedFields.push('image');
    }

    if (changedFields.length === 0) {
      if (nextFileKey) {
        await this.reportMediaStorage.deleteReportImage(nextFileKey);
      }

      throw new BadRequestException(
        'Nenhuma alteração válida foi identificada para o report.',
      );
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        await prisma.report.update({
          where: { id: report.id },
          data: {
            categoryId: nextCategoryId,
            content: nextContent,
          },
        });

        if (
          nextLatitude !== Number(currentLocation.latitude) ||
          nextLongitude !== Number(currentLocation.longitude)
        ) {
          await prisma.$executeRaw`
            UPDATE "Report"
            SET
              "location" = ST_SetSRID(ST_MakePoint(${nextLongitude}, ${nextLatitude}), 4326),
              "updatedAt" = NOW()
            WHERE "id" = ${report.id}
          `;
        }

        if (nextFileKey && nextFileMetadata) {
          const currentMedia = report.media[0];

          if (currentMedia) {
            await prisma.reportMedia.update({
              where: { id: currentMedia.id },
              data: {
                s3Key: nextFileKey,
                mimeType: nextFileMetadata.mimeType,
                fileSizeKb: nextFileMetadata.fileSizeKb,
                widthPx: nextFileMetadata.widthPx,
                heightPx: nextFileMetadata.heightPx,
              },
            });
          } else {
            await prisma.reportMedia.create({
              data: {
                reportId: report.id,
                s3Key: nextFileKey,
                mimeType: nextFileMetadata.mimeType,
                fileSizeKb: nextFileMetadata.fileSizeKb,
                widthPx: nextFileMetadata.widthPx,
                heightPx: nextFileMetadata.heightPx,
              },
            });
          }
        }

        await this.prisma.auditLog.create({
          data: {
            action: 'report_updated',
            entityType: 'report',
            entityId: report.id,
            actorId: userId,
            actorType: 'user',
            payload: {
              message: 'Report atualizado.',
              fields: changedFields,
              categoryId: nextCategoryId,
              latitude: nextLatitude,
              longitude: nextLongitude,
              imageKey: nextFileKey,
            },
          },
        });
      });
    } catch (error) {
      if (nextFileKey) {
        await this.reportMediaStorage.deleteReportImage(nextFileKey);
      }

      throw error;
    }

    if (previousFileKeyToDelete && previousFileKeyToDelete !== nextFileKey) {
      await this.reportMediaStorage.deleteReportImage(previousFileKeyToDelete);
    }

    const shouldSyncRiskAlertZone =
      category.isRisk === true &&
      (!report.category.isRisk ||
        nextLatitude !== Number(currentLocation.latitude) ||
        nextLongitude !== Number(currentLocation.longitude));

    if (shouldSyncRiskAlertZone) {
      this.eventEmitter.emit('report.updated-risk', {
        reportId: report.id,
        latitude: nextLatitude,
        longitude: nextLongitude,
      });
    }

    if (report.category.isRisk && !category.isRisk) {
      this.eventEmitter.emit('report.deactivated-risk', {
        reportId: report.id,
      });
    }

    return {
      id: report.id,
      categoryId: nextCategoryId,
      content: nextContent,
      latitude: nextLatitude,
      longitude: nextLongitude,
      image:
        nextFileKey && nextFileMetadata
          ? {
              key: nextFileKey,
              url: this.reportMediaStorage.getPublicUrl(nextFileKey),
              mimeType: nextFileMetadata.mimeType,
              fileSizeKb: nextFileMetadata.fileSizeKb,
              widthPx: nextFileMetadata.widthPx,
              heightPx: nextFileMetadata.heightPx,
            }
          : report.media[0]
            ? {
                key: report.media[0].s3Key,
                url: this.reportMediaStorage.getPublicUrl(
                  report.media[0].s3Key,
                ),
                mimeType: report.media[0].mimeType,
                fileSizeKb: report.media[0].fileSizeKb,
                widthPx: report.media[0].widthPx,
                heightPx: report.media[0].heightPx,
              }
            : null,
    };
  }
}
