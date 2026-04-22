import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class GetFollowingsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(publicId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        publicId,
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
              publicId: true,
              fullName: true,
              username: true,
              avatarSeed: true,
            },
          },
        },
      })
      .then((followings) =>
        followings.map((follow) => ({
          id: follow.id,
          createdAt: follow.createdAt,
          following: {
            id: follow.following.publicId,
            fullName: follow.following.fullName,
            username: follow.following.username,
            avatarSeed: follow.following.avatarSeed,
          },
        })),
      );
  }
}
