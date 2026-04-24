import { PrismaService } from '@/config/db/prisma.service';
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

    const reportConfirmaded = await this.prisma.$transaction(async (prisma) => {
      await prisma.reportConfirmation.create({
        data: { userId: user.id, reportId: report.id },
      });

      const updatedReport = await prisma.report.update({
        where: { id },
        data: { totalConfirmations: { increment: 1 } },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'report_confirmed',
          entityType: 'report',
          entityId: report.id,
          actorId: user.id,
          actorType: 'user',
          payload: {
            message: 'Report confirmado.',
            ownerId: report.userId,
          },
        },
      });

      return updatedReport;
    });

    this.eventEmitter.emit('report.confirmed', {
      userId: user.id,
      fullName: user.fullName,
      userConfirmedId: reportConfirmaded.user.id,
      userConfirmedemail: reportConfirmaded.user.email,
      userConfirmedFullName: reportConfirmaded.user.fullName,
    });

    return {
      userId: user.id,
      userConfirmedId: reportConfirmaded.user.id,
      reportId: report.id,
    };
  }
}
