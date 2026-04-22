import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { AuditLogService } from '@/shared/audit/audit-log.service';

@Injectable()
export class UnfollowUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, followingId: string) {
    const follower = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!follower) {
      throw new NotFoundException('Utilizador autenticado não encontrado.');
    }

    const following = await this.prisma.user.findFirst({
      where: {
        id: followingId,
        deletedAt: null,
        verifiedAt: { not: null },
        isBanned: false,
      },
    });

    if (!following) {
      throw new NotFoundException(
        'O utilizador que pretendes deixar de seguir não existe.',
      );
    }

    const follow = await this.prisma.follow.deleteMany({
      where: { followerId: follower.id, followingId: following.id },
    });

    if (!follow.count) {
      throw new NotFoundException('Não existe seguimento ativo para remover.');
    }

    await this.auditLog.create({
      action: 'user_unfollowed',
      entityType: 'user',
      entityId: following.id,
      actorId: follower.id,
      message: 'Seguimento removido.',
      payload: {
        followerId: follower.id,
      },
    });

    return { message: 'Deixaste de seguir este utilizador.' };
  }
}
