import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FollowUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
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
        'O utilizador que pretendes seguir não existe.',
      );
    }

    if (follower.id === following.id) {
      throw new BadRequestException('Não podes seguir a tua própria conta.');
    }

    const existingFollow = await this.prisma.follow.findFirst({
      where: { followerId: follower.id, followingId: following.id },
    });

    if (existingFollow) {
      throw new ConflictException('Já segues este utilizador.');
    }

    const follow = await this.prisma.follow.create({
      data: { followerId: follower.id, followingId: following.id },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'user_followed',
        actorType: 'system',
        actorId: follower.id,
        entityId: following.id,
        entityType: 'user',
      },
    });

    this.eventEmitter.emit('user.followed', {
      userId: following.id,
      followerName: follower.fullName,
      followerId: follower.id,
      email: following.email,
      fullName: following.fullName,
    });

    return {
      id: follow.id,
      followerId: follower.id,
      followingId: following.id,
      createdAt: follow.createdAt,
    };
  }
}
