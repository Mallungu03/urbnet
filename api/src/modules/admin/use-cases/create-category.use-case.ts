import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { AuditActorType, UserRole } from '@/generated/enums';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CreateCategoryUseCase {
  private logger = new Logger(CreateCategoryUseCase.name);

  constructor(private readonly prisma: PrismaService) {}
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

    await this.prisma.auditLog.create({
      data: {
        action: 'category_created',
        entityType: 'category',
        entityId: String(category.id),
        actorType: AuditActorType.admin,
        actorId: user.id,
        payload: {
          message: 'Categoria criada.',
          slug: category.slug,
          isRisk: category.isRisk,
        },
      },
    });

    this.logger.log(`Categoria com id ${category.id} criada`);
  }
}
