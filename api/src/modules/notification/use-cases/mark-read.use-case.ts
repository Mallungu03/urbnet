import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class MarkReadUseCase {
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

    await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), isRead: true },
    });

    return { message: `Message with id ${id} marked as read` };
  }
}
