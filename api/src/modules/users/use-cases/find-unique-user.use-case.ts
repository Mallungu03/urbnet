import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class FindUniqueUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const userAlreadExistis = await this.prisma.user.findFirst({
      where: {
        publicId: id,
        isBanned: false,
        deletedAt: null,
        verifiedAt: { not: null },
      },
    });

    if (!userAlreadExistis) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    return {
      id: userAlreadExistis.publicId,
      name: userAlreadExistis.fullName,
      username: userAlreadExistis.username,
      email: userAlreadExistis.email,
      avatar: userAlreadExistis.avatarSeed,
    };
  }
}
