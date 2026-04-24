import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { UserRole } from '@/generated/enums';
import { UpdateCategoryDto } from '../dto/update-category.dto';

import { AuditActorType } from '@/generated/enums';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    categoryId: number,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const name = String(updateCategoryDto.name);
    const slug = String(updateCategoryDto.slug);
    const isRisk = Boolean(updateCategoryDto.isRisk);
    const colorHex = String(updateCategoryDto.colorHex);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, isBanned: false, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.role !== UserRole.admin) {
      throw new UnauthorizedException();
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException();
    }

    const dataToUpdate: {
      name?: string;
      slug?: string;
      isRisk?: boolean;
      colorHex?: string;
    } = {};

    if (name !== undefined) {
      dataToUpdate.name = name;
    }

    if (slug !== undefined) {
      const slugAlreadExists = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (slugAlreadExists) {
        throw new ConflictException();
      }

      dataToUpdate.slug = slug;
    }

    if (isRisk !== undefined) {
      dataToUpdate.isRisk = isRisk;
    }

    if (colorHex !== undefined) {
      dataToUpdate.colorHex = colorHex;
    }

    if (!Object.keys(dataToUpdate).length) {
      throw new BadRequestException(
        'Pelo menos um campo deve ser informado para atualização.',
      );
    }

    const categoryUpdated = await this.prisma.category.update({
      where: { id: categoryId },
      data: dataToUpdate,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'category_updated',
        entityType: 'category',
        entityId: String(categoryUpdated.id),
        actorType: AuditActorType.admin,
        actorId: user.id,
        payload: {
          message: 'Categoria atualizada.',
          fields: Object.keys(dataToUpdate),
        },
      },
    });
  }
}
