import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserRole } from '@/generated/prisma/enums';
import { AuditActorType } from '@/generated/prisma/enums';
import { AuditLogService } from '@/shared/audit/audit-log.service';

@Injectable()
export class AlterUserRoleUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

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

    await this.auditLog.create({
      action: 'user_role_changed',
      entityType: 'user',
      entityId: updatedUser.id,
      actorType: AuditActorType.admin,
      actorId: user.id,
      message:
        nextRole === UserRole.admin
          ? 'Permissao de admin concedida.'
          : 'Permissao de admin removida.',
      payload: {
        previousRole: userToAlterRole.role,
        newRole: nextRole,
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
