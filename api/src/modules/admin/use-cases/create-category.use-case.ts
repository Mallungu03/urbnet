import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { AuditActorType, UserRole } from '@/generated/prisma/enums';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { AuditLogService } from '@/shared/audit/audit-log.service';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}
  async execute(id: string, createAdminDto: CreateCategoryDto) {
    const name = String(createAdminDto.name);
    const slug = String(createAdminDto.slug);
    const isRisk = Boolean(createAdminDto.isRisk);
    const colorHex = String(createAdminDto.colorHex);

    const user = await this.prisma.user.findUnique({
      where: { id, isBanned: false, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.role !== UserRole.admin) {
      throw new UnauthorizedException();
    }

    const slugAlreadExistis = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (slugAlreadExistis) {
      throw new ConflictException();
    }

    const category = await this.prisma.category.create({
      data: { name, slug, colorHex, createdBy: user.id, isRisk },
    });

    await this.auditLog.create({
      action: 'category_created',
      entityType: 'category',
      entityId: category.id,
      actorType: AuditActorType.admin,
      actorId: user.id,
      message: 'Categoria criada.',
      payload: {
        slug: category.slug,
        isRisk: category.isRisk,
      },
    });
  }
}
