import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class GetFollowersUseCase {
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
        where: { followingId: user.id },
        include: {
          follower: {
            select: {
              publicId: true,
              fullName: true,
              username: true,
              avatarSeed: true,
            },
          },
        },
      })
      .then((followers) =>
        followers.map((follow) => ({
          id: follow.id,
          createdAt: follow.createdAt,
          follower: {
            id: follow.follower.publicId,
            fullName: follow.follower.fullName,
            username: follow.follower.username,
            avatarSeed: follow.follower.avatarSeed,
          },
        })),
      );
  }
}
