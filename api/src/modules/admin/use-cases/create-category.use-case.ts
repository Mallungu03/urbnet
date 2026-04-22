import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserRole } from '@/generated/prisma/enums';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CreateCategoryUseCase {
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
        action: 'create category',
        actorType: 'admin',
        entityId: String(category.id),
        actorId: user.id,
        entityType: 'category',
        payload: {},
      },
    });
  }
}
