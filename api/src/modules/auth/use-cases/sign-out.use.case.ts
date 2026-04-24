import { Injectable, NotFoundException } from '@nestjs/common';
import { SignOutDto } from '../dto/sign-out.dto';
import { PrismaService } from '@/config/db/prisma.service';

@Injectable()
export class SignOutUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, signOutDto: SignOutDto) {
    const userAlreadyExists = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!userAlreadyExists) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const device = await this.prisma.device.findFirst({
      where: {
        userId: userAlreadyExists.id,
        fingerprint: String(signOutDto.fingerprint),
        revokedAt: null,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Nenhuma sessão ativa para este dispositivo.',
      );
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.refreshToken.updateMany({
        where: {
          userId: userAlreadyExists.id,
          deviceId: device.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await prisma.device.update({
        where: { id: device.id },
        data: {
          revokedAt: new Date(),
          pushToken: null,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'user_signed_out',
          entityType: 'user',
          entityId: userAlreadyExists.id,
          actorId: userAlreadyExists.id,
          actorType: 'user',
          payload: {
            message: 'Sessao encerrada.',
            fingerprint: String(signOutDto.fingerprint),
            platform: String(signOutDto.platform),
          },
        },
      });
    });

    return { message: 'Sessão encerrada com sucesso neste dispositivo.' };
  }
}
