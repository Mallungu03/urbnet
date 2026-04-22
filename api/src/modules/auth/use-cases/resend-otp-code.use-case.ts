import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import * as argon2 from 'argon2';

@Injectable()
export class resendOtpCodeUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(resensOtpCode: ResendOtpDto) {
    const userAlreadExistis = await this.prisma.user.findFirst({
      where: {
        email: resensOtpCode.email,
        verifiedAt: null,
        isBanned: false,
        deletedAt: null,
      },
    });

    if (!userAlreadExistis) {
      throw new NotFoundException('Nenhuma conta pendente para este email.');
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
        actorType: 'system',
        entityId: userAlreadExistis.id,
        entityType: 'user',
        payload: {
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
      id: userAlreadExistis.publicId,
      email: userAlreadExistis.email,
      fullName: userAlreadExistis.fullName,
      username: userAlreadExistis.username,
      role: userAlreadExistis.role,
      otp,
    };
  }
}
