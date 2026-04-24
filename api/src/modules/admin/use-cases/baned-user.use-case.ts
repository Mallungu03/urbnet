import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { UserRole } from '@/generated/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditActorType } from '@/generated/enums';
import type { User } from '@/generated/client';

@Injectable()
export class BanedUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
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

    await this.prisma.auditLog.create({
      data: {
        action: updatedUser.isBanned ? 'user_banned' : 'user_unbanned',
        entityType: 'user',
        entityId: updatedUser.id,
        actorType: AuditActorType.admin,
        actorId: user.id,
        payload: {
          message: updatedUser.isBanned
            ? 'Utilizador banido.'
            : 'Utilizador reativado.',
          isBanned: updatedUser.isBanned,
        },
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
