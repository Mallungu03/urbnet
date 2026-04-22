import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ConfirmReportUseCase {
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

    if (user.id === report.userId) {
      throw new UnauthorizedException();
    }

    const reportConfirmaded = this.prisma.$transaction(async (prisma) => {
      await prisma.reportConfirmation.create({
        data: { userId: user.id, reportId: report.id },
      });

      return await prisma.report.update({
        where: { id },
        data: { totalConfirmations: { increment: 1 } },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });
    });

    this.eventEmitter.emit('report.confirmed', {
      userId: user.id,
      fullName: user.fullName,
      userConfirmedId: (await reportConfirmaded).user.id,
      userConfirmedemail: (await reportConfirmaded).user.email,
      userConfirmedFullName: (await reportConfirmaded).user.fullName,
    });

    return {
      userId: user.id,
      userConfirmedId: (await reportConfirmaded).user.id,
      reportId: report.id,
    };
  }
}
