import { PrismaService } from '@/config/db/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class GetManyUseCase {
  constructor(private readonly prisma: PrismaService) {}
  async execute(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException();
    }

    return await this.prisma.notification.findMany({
      where: { userId: user.id, channel: 'in_app' },
      orderBy: { sentAt: 'desc' },
    });
  }
}
