import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserRole } from '@/generated/prisma/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditActorType } from '@/generated/prisma/enums';
import { AuditLogService } from '@/shared/audit/audit-log.service';
import type { User } from '@/generated/prisma/client';

@Injectable()
export class BanedUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
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
      where: { id, deletedAt: null },
    });

    if (!userToAlterRole) {
      throw new NotFoundException();
    }

    let updatedUser: User;

    if (userToAlterRole.isBanned === true) {
      updatedUser = await this.prisma.user.update({
        where: { id: userToAlterRole.id },
        data: { isBanned: false, updatedAt: new Date() },
      });

      this.eventEmitter.emit('admin.unbaned-user', {
        id: userToAlterRole.id,
        email: userToAlterRole.email,
        fullName: userToAlterRole.fullName,
        role: userToAlterRole.role,
      });
    } else {
      updatedUser = await this.prisma.user.update({
        where: { id: userToAlterRole.id },
        data: { isBanned: true, updatedAt: new Date() },
      });
      this.eventEmitter.emit('admin.baned-user', {
        id: userToAlterRole.id,
        email: userToAlterRole.email,
        fullName: userToAlterRole.fullName,
      });
    }

    await this.auditLog.create({
      action: updatedUser.isBanned ? 'user_banned' : 'user_unbanned',
      entityType: 'user',
      entityId: updatedUser.id,
      actorType: AuditActorType.admin,
      actorId: user.id,
      message: updatedUser.isBanned
        ? 'Utilizador banido.'
        : 'Utilizador reativado.',
      payload: {
        isBanned: updatedUser.isBanned,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      username: updatedUser.username,
    };
  }
}
