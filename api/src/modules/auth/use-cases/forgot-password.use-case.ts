import { Injectable, NotFoundException } from '@nestjs/common';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';
import { AuditLogService } from '@/shared/audit/audit-log.service';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

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

    await this.auditLog.create({
      action: 'forgot_password',
      entityType: 'user',
      entityId: user.id,
      message: 'Codigo de recuperacao enviado.',
      payload: {
        email: user.email,
      },
    });

    return { message: 'Enviámos um código de recuperação para o teu email.' };
  }
}
