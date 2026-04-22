import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserAvatarStorageService } from '../services/user-avatar-storage.service';
import { buildAvatarUrl, buildAvatarValue } from '../utils/user-avatar-response.util';

@Injectable()
export class FindUniqueUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userAvatarStorage: UserAvatarStorageService,
  ) {}

  async execute(id: string) {
    const userAlreadExistis = await this.prisma.user.findFirst({
      where: {
        id,
        isBanned: false,
        deletedAt: null,
        verifiedAt: { not: null },
      },
    });

    if (!userAlreadExistis) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    return {
      id: userAlreadExistis.id,
      name: userAlreadExistis.fullName,
      username: userAlreadExistis.username,
      email: userAlreadExistis.email,
      avatar: buildAvatarValue(
        userAlreadExistis.avatarSeed,
        userAlreadExistis.avatarKey,
        this.userAvatarStorage,
      ),
      avatarSeed: userAlreadExistis.avatarSeed,
      avatarUrl: buildAvatarUrl(
        userAlreadExistis.avatarKey,
        this.userAvatarStorage,
      ),
    };
  }
}
