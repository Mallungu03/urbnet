import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';
import { CreateReportDto } from '../dto/create-report.dto';
import { PrismaService } from '@/config/db/prisma.service';
import {} from 'multer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { ReportMediaStorageService } from '../services/report-media-storage.service';

@Injectable()
export class CreateReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmmitter: EventEmitter2,
    private readonly reportMediaStorage: ReportMediaStorageService,
  ) {}

  async execute(
    userId: string,
    dto: CreateReportDto,
    file: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isBanned: false, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    if (!file?.buffer) {
      throw new BadRequestException('A imagem do report é obrigatória.');
    }

    const categoryId = Number(dto.categoryId);
    const content = String(dto.content).trim();
    const latitude = Number(dto.latitude);
    const longitude = Number(dto.longitude);

    const categoryExistis = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true, deletedAt: null },
    });

    if (!categoryExistis) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    const optimizedBuffer = await image
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const width = metadata.width ?? null;
    const height = metadata.height ?? null;
    const fileSizeKb = Math.ceil(optimizedBuffer.length / 1024);
    const fileKey = `reports/${userId}/${randomUUID()}.jpg`;

    await this.reportMediaStorage.saveReportImage(fileKey, optimizedBuffer);

    try {
      const report = await this.prisma.$transaction(async (prisma) => {
        const [createdReport] = await prisma.$queryRaw<
          Array<{
            id: string;
            createdAt: Date;
            totalConfirmations: number;
          }>
        >`
            INSERT INTO "Report" ("userId", "categoryId", "content", "location")
            VALUES (
              ${user.id},
              ${categoryId},
              ${content},
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
            )
            RETURNING "id", "createdAt", "totalConfirmations"
          `;

        await prisma.reportMedia.create({
          data: {
            reportId: createdReport.id,
            s3Key: fileKey,
            mimeType: 'image/jpeg',
            fileSizeKb,
            widthPx: width,
            heightPx: height,
          },
        });

        await this.prisma.auditLog.create({
          data: {
            action: 'report_created',
            entityType: 'report',
            entityId: createdReport.id,
            actorId: user.id,
            actorType: 'system',
            payload: {
              message: 'Report criado.',
              categoryId,
              fileKey,
              mimeType: 'image/jpeg',
              fileSizeKb,
              widthPx: width,
              heightPx: height,
            },
          },
        });

        return createdReport;
      });

      if (categoryExistis.isRisk === true) {
        this.eventEmmitter.emit('report.created-risk', {
          reportId: report.id,
          latitude,
          longitude,
        });
      }

      return {
        id: report.id,
        categoryId,
        confirmations: report.totalConfirmations,
        latitude,
        longitude,
        image: {
          key: fileKey,
          url: this.reportMediaStorage.getPublicUrl(fileKey),
          mimeType: 'image/jpeg',
          fileSizeKb,
          widthPx: width,
          heightPx: height,
        },
        createdAt: report.createdAt,
      };
    } catch (error) {
      await this.reportMediaStorage.deleteReportImage(fileKey);
      throw error;
    }
  }
}
