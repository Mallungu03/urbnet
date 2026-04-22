import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserAvatarStorageService } from '../services/user-avatar-storage.service';
import {
  buildAvatarUrl,
  buildAvatarValue,
} from '../utils/user-avatar-response.util';

@Injectable()
export class MyProfileUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userAvatarStorage: UserAvatarStorageService,
  ) {}

  async execute(id: string) {
    const userAlreadExistis = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userAlreadExistis) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    return {
      id: userAlreadExistis.id,
      fullName: userAlreadExistis.fullName,
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
      verifiedAt: userAlreadExistis.verifiedAt,
      createdAt: userAlreadExistis.createdAt,
    };
  }
}
