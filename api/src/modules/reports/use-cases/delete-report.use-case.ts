import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DeleteReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isBanned: false, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const report = await this.prisma.report.findFirst({
      where: { id, deletedAt: null },
    });

    if (!report) {
      throw new NotFoundException('Report não encontrado.');
    }

    if (user.id !== report.userId) {
      throw new UnauthorizedException();
    }

    await this.prisma.report.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.eventEmitter.emit('report.deleted');
  }
}
