import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DeleteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, id: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException();
    }
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) {
      throw new NotFoundException();
    }

    await this.prisma.notification.delete({
      where: { id, userId: user.id },
    });
  }
}
