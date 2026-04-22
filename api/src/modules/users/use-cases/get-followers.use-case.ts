import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserAvatarStorageService } from '../services/user-avatar-storage.service';
import { buildAvatarUrl } from '../utils/user-avatar-response.util';

@Injectable()
export class GetFollowersUseCase {
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
        where: { followingId: user.id },
        include: {
          follower: {
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
      .then((followers) =>
        followers.map((follow) => ({
          id: follow.id,
          createdAt: follow.createdAt,
          follower: {
            id: follow.follower.id,
            fullName: follow.follower.fullName,
            username: follow.follower.username,
            avatarSeed: follow.follower.avatarSeed,
            avatarUrl: buildAvatarUrl(
              follow.follower.avatarKey,
              this.userAvatarStorage,
            ),
          },
        })),
      );
  }
}
