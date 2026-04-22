import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../users.service';

@Injectable()
export class deleteAccountUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersServices: UsersService,
  ) {}

  async execute(authId: string, targetId: string) {
    if (authId !== targetId) {
      throw new ForbiddenException('Só podes encerrar a tua própria conta.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const username = await this.usersServices.generateUserName('User Deleted');
    const email = await this.usersServices.generateEmailDeleted(
      `user${user.id}deleted@reporta.com`,
    );

    await this.prisma.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          deletedAt: new Date(),
          email,
          username,
        },
      });
      await prisma.follow.deleteMany({
        where: {
          OR: [{ followerId: user.id }, { followingId: user.id }],
        },
      });
      await prisma.auditLog.create({
        data: {
          action: 'user_deleted',
          actorType: 'system',
          actorId: user.id,
          entityId: user.id,
          entityType: 'user',
        },
      });
    });

    this.eventEmitter.emit('user.deleted', {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
    });

    return { message: 'Conta encerrada com sucesso.' };
  }
}
