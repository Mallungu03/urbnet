import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class GetManyUseCase {
  constructor(private readonly prisma: PrismaService) {}
  async execute(publicId: string) {
    const user = await this.prisma.user.findUnique({ where: { publicId } });

    if (!user) {
      throw new NotFoundException();
    }

    return await this.prisma.notification.findMany({
      where: { userId: user.id, channel: 'in_app' },
    });
  }
}
