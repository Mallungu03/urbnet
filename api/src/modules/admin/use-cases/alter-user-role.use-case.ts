import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@/generated/enums';
import { AuditActorType } from '@/generated/enums';
import { PrismaService } from '@/config/db/prisma.service';

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

    const nextRole =
      userToAlterRole.role === UserRole.admin
        ? UserRole.citizen
        : UserRole.admin;

    const updatedUser = await this.prisma.user.update({
      where: { id: userToAlterRole.id },
      data: { role: nextRole, updatedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'user_role_changed',
        entityType: 'user',
        entityId: updatedUser.id,
        actorType: AuditActorType.admin,
        actorId: user.id,
        payload: {
          message:
            nextRole === UserRole.admin
              ? 'Permissao de admin concedida.'
              : 'Permissao de admin removida.',
          previousRole: userToAlterRole.role,
          newRole: nextRole,
        },
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      username: updatedUser.username,
      role: updatedUser.role,
    };
  }
}
