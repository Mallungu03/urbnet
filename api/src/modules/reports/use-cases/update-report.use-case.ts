import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/config/db/prisma.service';
import { UpdateReportDto } from '../dto/update-report.dto';
import { UploadService } from '@/modules/upload/upload.service';

@Injectable()
export class UpdateReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly uploadService: UploadService,
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

    const categoryId =
      dto.categoryId !== undefined ? Number(dto.categoryId) : report.categoryId;
    const content =
      dto.content !== undefined ? String(dto.content).trim() : report.content;
    const newLatitude =
      dto.latitude !== undefined
        ? Number(dto.latitude)
        : Number(currentLocation.latitude);
    const newLongitude =
      dto.longitude !== undefined
        ? Number(dto.longitude)
        : Number(currentLocation.longitude);

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const changedFields: string[] = [];
    let newFileKey;
    let previousFileKeyToDelete: string | null = null;
    let newFileMetadata: {
      mimeType: string;
      fileSizeKb: number;
      widthPx: number | null;
      heightPx: number | null;
    } | null = null;

    if (dto.categoryId !== undefined && categoryId !== report.categoryId) {
      changedFields.push('categoryId');
    }

    if (dto.content !== undefined && content !== report.content) {
      changedFields.push('content');
    }

    if (newLatitude !== Number(currentLocation.latitude)) {
      changedFields.push('latitude');
    }

    if (newLongitude !== Number(currentLocation.longitude)) {
      changedFields.push('longitude');
    }

    if (file?.buffer) {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      const optimizedBuffer = await image
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const publicId = `uploads/reports/${report.id}/${Date.now()}`;
      const uploadResult = await this.uploadService.uploadBuffer(
        optimizedBuffer,
        'uploads/reports',
        publicId,
      );
      newFileKey = uploadResult.public_id;

      newFileMetadata = {
        mimeType: 'image/jpeg',
        fileSizeKb: Math.ceil(optimizedBuffer.length / 1024),
        widthPx: metadata.width ?? null,
        heightPx: metadata.height ?? null,
      };

      previousFileKeyToDelete = report.media[0]?.s3Key ?? null;
      changedFields.push('image');
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        await prisma.report.update({
          where: { id: report.id },
          data: {
            categoryId: categoryId,
            content: content,
          },
        });

        if (
          newLatitude !== Number(currentLocation.latitude) ||
          newLongitude !== Number(currentLocation.longitude)
        ) {
          await prisma.$executeRaw`
            UPDATE "Report"
            SET
              "location" = ST_SetSRID(ST_MakePoint(${newLongitude}, ${newLatitude}), 4326),
              "updatedAt" = NOW()
            WHERE "id" = ${report.id}
          `;
        }

        if (newFileKey && newFileMetadata) {
          const currentMedia = report.media[0];

          if (currentMedia) {
            await prisma.reportMedia.update({
              where: { id: currentMedia.id },
              data: {
                s3Key: newFileKey,
                mimeType: newFileMetadata.mimeType,
                fileSizeKb: newFileMetadata.fileSizeKb,
                widthPx: newFileMetadata.widthPx,
                heightPx: newFileMetadata.heightPx,
              },
            });
          } else {
            await prisma.reportMedia.create({
              data: {
                reportId: report.id,
                s3Key: newFileKey,
                mimeType: newFileMetadata.mimeType,
                fileSizeKb: newFileMetadata.fileSizeKb,
                widthPx: newFileMetadata.widthPx,
                heightPx: newFileMetadata.heightPx,
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
              categoryId: categoryId,
              latitude: newLatitude,
              longitude: newLongitude,
              imageKey: newFileKey,
            },
          },
        });
      });
    } catch (error) {
      if (newFileKey) {
        await this.uploadService.deleteFile(newFileKey);
      }

      throw error;
    }

    if (previousFileKeyToDelete) {
      await this.uploadService.deleteFile(previousFileKeyToDelete);
    }

    const shouldSyncRiskAlertZone =
      category.isRisk === true &&
      (!report.category.isRisk ||
        newLatitude !== Number(currentLocation.latitude) ||
        newLongitude !== Number(currentLocation.longitude));

    if (shouldSyncRiskAlertZone) {
      this.eventEmitter.emit('report.updated-risk', {
        reportId: report.id,
        latitude: newLatitude,
        longitude: newLongitude,
      });
    }

    if (report.category.isRisk && !category.isRisk) {
      this.eventEmitter.emit('report.deactivated-risk', {
        reportId: report.id,
      });
    }

    return {
      id: report.id,
      categoryId: categoryId,
      content: content,
      latitude: newLatitude,
      longitude: newLongitude,
      image: newFileKey
        ? {
            key: newFileKey,
            url: this.uploadService.getPublicUrl(newFileKey),
            mimeType: newFileMetadata!.mimeType,
            fileSizeKb: newFileMetadata!.fileSizeKb,
            widthPx: newFileMetadata!.widthPx,
            heightPx: newFileMetadata!.heightPx,
          }
        : report.media[0]
        ? {
            key: report.media[0].s3Key,
            url: this.uploadService.getPublicUrl(report.media[0].s3Key),
            mimeType: report.media[0].mimeType,
            fileSizeKb: report.media[0].fileSizeKb,
            widthPx: report.media[0].widthPx,
            heightPx: report.media[0].heightPx,
          }
        : null,
    };
  }
}
