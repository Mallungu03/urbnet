import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { UserRole } from '@/generated/enums';
import { AdminService } from '../admin.service';
import { AuditActorType } from '@/generated/enums';

@Injectable()
export class RemoveCategoryUseCase {
  private logger = new Logger(RemoveCategoryUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
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

    await this.prisma.auditLog.create({
      data: {
        action: 'category_deleted',
        entityType: 'category',
        entityId: String(categoryDeleted.id),
        actorType: AuditActorType.admin,
        actorId: user.id,
        payload: {
          message: 'Categoria removida.',
          previousSlug: category.slug,
        },
      },
    });

    this.logger.log(`Categoria com id ${categoryDeleted.id} eliminada`);
  }
}
