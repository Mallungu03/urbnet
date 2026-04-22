import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FindUniqueReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const report = await this.prisma.report.findFirst({
      where: { id, deletedAt: null },
    });

    if (!report) {
      throw new NotFoundException('Report não encontrado.');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: report.userId, deletedAt: null, isBanned: false },
    });

    return {
      id: report.id,
      userId: user?.id,
      categoryId: report.categoryId,
      content: report.content,
      createdAt: report.createdAt,
    };
  }
}
