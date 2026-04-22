import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserAvatarStorageService } from '../services/user-avatar-storage.service';
import { buildAvatarUrl } from '../utils/user-avatar-response.util';

@Injectable()
export class GetFollowingsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userAvatarStorage: UserAvatarStorageService,
  ) {}

  async execute(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        verifiedAt: { not: null },
        isBanned: false,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    return await this.prisma.follow
      .findMany({
        where: { followerId: user.id },
        include: {
          following: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatarSeed: true,
              avatarKey: true,
            },
          },
        },
      })
      .then((followings) =>
        followings.map((follow) => ({
          id: follow.id,
          createdAt: follow.createdAt,
          following: {
            id: follow.following.id,
            fullName: follow.following.fullName,
            username: follow.following.username,
            avatarSeed: follow.following.avatarSeed,
            avatarUrl: buildAvatarUrl(
              follow.following.avatarKey,
              this.userAvatarStorage,
            ),
          },
        })),
      );
  }
}
