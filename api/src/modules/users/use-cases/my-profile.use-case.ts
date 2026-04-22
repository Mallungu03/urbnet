import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class MyProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}
  async execute(id: string) {
    const userAlreadExistis = await this.prisma.user.findUnique({
      where: { publicId: id },
    });

    if (!userAlreadExistis) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    return {
      id: userAlreadExistis.publicId,
      fullName: userAlreadExistis.fullName,
      username: userAlreadExistis.username,
      email: userAlreadExistis.email,
      avatarSeed: userAlreadExistis.avatarSeed,
      verifiedAt: userAlreadExistis.verifiedAt,
      createdAt: userAlreadExistis.createdAt,
    };
  }
}
