import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';

@Injectable()
export class GetMySessionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    return await this.prisma.refreshToken.findMany({
      where: {
        userId: userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        device: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
