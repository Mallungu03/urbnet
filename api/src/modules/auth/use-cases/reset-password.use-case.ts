import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import * as argon2 from 'argon2';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from '../auth.service';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
  ) {}

  async execute(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;

    const userAlreadyExists = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        verifiedAt: { not: null },
        isBanned: false,
      },
    });

    if (!userAlreadyExists) {
      throw new NotFoundException(
        'Nenhum utilizador ativo foi encontrado para este email.',
      );
    }

    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: userAlreadyExists.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('O código OTP é inválido ou expirou.');
    }

    const isOtpValid = await argon2.verify(otpRecord.codeHash, String(otp));

    if (!isOtpValid) {
      throw new BadRequestException('O código OTP é inválido ou expirou.');
    }

    const user = await this.prisma.$transaction(async (prisma) => {
      await prisma.otp.delete({
        where: { id: otpRecord.id },
      });

      const passwordHash = await argon2.hash(newPassword);

      const user = await prisma.user.update({
        where: { id: userAlreadyExists.id },
        data: { passwordHash },
      });

      this.eventEmitter.emit('auth.password-reset', {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      });

      await prisma.auditLog.create({
        data: {
          action: 'password_reset',
          actorType: 'system',
          entityId: user.id,
          entityType: 'user',
          payload: {
            email: user.email,
          },
        },
      });

      return user;
    });

    const tokens = await this.authService.generateTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        publicId: user.publicId,
      },
      resetPasswordDto,
    );

    return {
      id: user.publicId,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      tokens,
    };
  }
}
