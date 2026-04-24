import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailDto } from '../dto/email.dto';
import { PrismaService } from '@/config/db/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(emailDto: EmailDto) {
    const email = String(emailDto.email);

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        verifiedAt: { not: null },
        isBanned: false,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Nenhum utilizador ativo foi encontrado para este email.',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    this.eventEmitter.emit('auth.forgot-password', {
      userId: user.id,
      email: user.email,
      otp: otp,
      fullName: user.fullName,
    });

    const codeHash = await argon2.hash(otp);

    await this.prisma.otp.create({
      data: {
        codeHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'forgot_password',
        entityType: 'user',
        entityId: user.id,
        actorType: 'user',
        payload: {
          message: 'Codigo de recuperacao enviado.',
          email: user.email,
        },
      },
    });

    return { message: 'Enviámos um código de recuperação para o teu email.' };
  }
}
