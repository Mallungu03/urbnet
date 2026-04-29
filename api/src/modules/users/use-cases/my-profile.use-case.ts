import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { UploadService } from '@/modules/upload/upload.service';
import { UsersService } from '../services/users.service';

@Injectable()
export class MyProfileUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly usersService: UsersService,
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
      avatar: this.usersService.buildAvatarValue(
        userAlreadExistis.avatarSeed,
        userAlreadExistis.avatarKey,
        this.uploadService,
      ),
      avatarSeed: userAlreadExistis.avatarSeed,
      avatarUrl: this.usersService.buildAvatarUrl(
        userAlreadExistis.avatarKey,
        this.uploadService,
      ),
      verifiedAt: userAlreadExistis.verifiedAt,
      createdAt: userAlreadExistis.createdAt,
    };
  }
}
