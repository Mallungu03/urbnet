import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserRole } from '@/generated/prisma/enums';
import { AdminService } from '../admin.service';
import { AuditActorType } from '@/generated/prisma/enums';
import { AuditLogService } from '@/shared/audit/audit-log.service';

@Injectable()
export class RemoveCategoryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isBanned: false, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.role !== UserRole.admin) {
      throw new UnauthorizedException();
    }

    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException();
    }

    const slug = await this.adminService.generateSlugDeleted(category.slug);
    const categoryDeleted = await this.prisma.category.update({
      where: { id },
      data: {
        name: `category-${category.id}-deleted`,
        slug,
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await this.auditLog.create({
      action: 'category_deleted',
      entityType: 'category',
      entityId: categoryDeleted.id,
      actorType: AuditActorType.admin,
      actorId: user.id,
      message: 'Categoria removida.',
      payload: {
        previousSlug: category.slug,
      },
    });
  }
}
