import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserRole } from '@/generated/prisma/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

    if (userToAlterRole.isBanned === true) {
      await this.prisma.user.update({
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
      await this.prisma.user.update({
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
        action: 'banedUser',
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
    };
  }
}
