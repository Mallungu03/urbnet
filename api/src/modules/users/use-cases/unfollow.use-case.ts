import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class UnfollowUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(publicId: string, followingId: string) {
    const follower = await this.prisma.user.findUnique({
      where: { publicId },
    });

    if (!follower) {
      throw new NotFoundException('Utilizador autenticado não encontrado.');
    }

    const following = await this.prisma.user.findFirst({
      where: {
        publicId: followingId,
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

    await this.prisma.auditLog.create({
      data: {
        action: 'user_unfollowed',
        actorType: 'system',
        actorId: follower.id,
        entityId: following.id,
        entityType: 'user',
      },
    });

    return { message: 'Deixaste de seguir este utilizador.' };
  }
}
