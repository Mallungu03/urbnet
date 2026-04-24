import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { UserAvatarStorageService } from '../services/user-avatar-storage.service';
import { UsersService } from '../services/users.service';

@Injectable()
export class FindUniqueUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userAvatarStorage: UserAvatarStorageService,
    private readonly usersService: UsersService,
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
      avatar: this.usersService.buildAvatarValue(
        userAlreadExistis.avatarSeed,
        userAlreadExistis.avatarKey,
        this.userAvatarStorage,
      ),
      avatarSeed: userAlreadExistis.avatarSeed,
      avatarUrl: this.usersService.buildAvatarUrl(
        userAlreadExistis.avatarKey,
        this.userAvatarStorage,
      ),
    };
  }
}
