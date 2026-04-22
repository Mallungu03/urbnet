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

  async execute(publicId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { publicId, isBanned: false, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const report = await this.prisma.report.findFirst({
      where: { publicId: id, deletedAt: null },
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
        where: { publicId: id },
        data: { totalConfirmations: { increment: 1 } },
        include: {
          user: { select: { publicId: true, email: true, fullName: true } },
        },
      });
    });

    this.eventEmitter.emit('report.confirmed', {
      userId: user.publicId,
      fullName: user.fullName,
      userConfirmedId: (await reportConfirmaded).user.publicId,
      userConfirmedemail: (await reportConfirmaded).user.email,
      userConfirmedFullName: (await reportConfirmaded).user.fullName,
    });

    return {
      userId: user.publicId,
      userConfirmedId: (await reportConfirmaded).user.publicId,
      reportId: report.publicId,
    };
  }
}
