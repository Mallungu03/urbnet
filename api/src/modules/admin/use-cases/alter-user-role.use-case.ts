import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserRole } from '@/generated/prisma/enums';

@Injectable()
export class AlterUserRoleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isBanned: false, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.role !== UserRole.admin) {
      throw new UnauthorizedException();
    }

    const userToAlterRole = await this.prisma.user.findUnique({
      where: { id: id, deletedAt: null },
    });

    if (!userToAlterRole) {
      throw new NotFoundException();
    }

    if (userToAlterRole.role === UserRole.admin) {
      await this.prisma.user.update({
        where: { id: userToAlterRole.id },
        data: { role: UserRole.admin, updatedAt: new Date() },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userToAlterRole.id },
        data: { role: UserRole.admin, updatedAt: new Date() },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'Alter Role',
        entityType: 'user',
        actorId: user.id,
        actorType: 'admin',
        entityId: userToAlterRole.id,
        payload: {},
      },
    });

    return {
      id: userToAlterRole.id,
      email: userToAlterRole.email,
      fullName: userToAlterRole.fullName,
      username: userToAlterRole.username,
      role: userToAlterRole.role,
    };
  }
}
