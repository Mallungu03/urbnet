import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@/generated/enums';
import { AuditActorType } from '@/generated/enums';
import { PrismaService } from '@/config/db/prisma.service';

@Injectable()
export class AlterUserRoleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  private logger = new Logger(AlterUserRoleUseCase.name);

  async execute(adminId: string, id: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId, isBanned: false, deletedAt: null },
    });

    if (!admin) {
      throw new NotFoundException();
    }

    if (admin.role !== UserRole.admin) {
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
        actorId: admin.id,
        payload: {
          message: `Usuario com permissoes de  ${nextRole} concedidas`,
          previousRole: userToAlterRole.role,
          newRole: nextRole,
        },
      },
    });

    this.logger.log(
      `Usuario com id ${userToAlterRole.id} com permissões de ${nextRole} concedidada`,
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      username: updatedUser.username,
      role: updatedUser.role,
    };
  }
}
