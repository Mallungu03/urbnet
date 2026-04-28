import { PrismaService } from '@/config/db/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import { EmailDto } from '../dto/email.dto';

@Injectable()
export class resendOtpCodeUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(emailDto: EmailDto) {
    const userAlreadExistis = await this.prisma.user.findFirst({
      where: {
        email: String(emailDto.email),
        verifiedAt: null,
        isBanned: false,
        deletedAt: null,
      },
    });

    if (!userAlreadExistis) {
      throw new NotFoundException('Nenhuma conta pendente para este email.');
    }

    // Rate limiting: máximo 3 OTPs por hora por usuário
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtpsCount = await this.prisma.otp.count({
      where: {
        userId: userAlreadExistis.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentOtpsCount >= 3) {
      throw new NotFoundException(
        'Muitas tentativas. Tente novamente em 1 hora.',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.otp.create({
      data: {
        userId: userAlreadExistis.id,
        codeHash: await argon2.hash(otp),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'otp_resent',
        entityType: 'user',
        entityId: userAlreadExistis.id,
        actorType: 'user',
        payload: {
          message: 'Novo codigo enviado.',
          email: userAlreadExistis.email,
        },
      },
    });

    this.eventEmitter.emit('auth.otp-resent', {
      userId: userAlreadExistis.id,
      fullName: userAlreadExistis.fullName,
      email: userAlreadExistis.email,
      otp,
    });

    return {
      id: userAlreadExistis.id,
      email: userAlreadExistis.email,
      fullName: userAlreadExistis.fullName,
      username: userAlreadExistis.username,
      role: userAlreadExistis.role,
      otp,
    };
  }
}
