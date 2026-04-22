import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from '../auth.service';
import { VerifyUserDto } from '../dto/verify-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class VerifyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
  ) {}

  async execute(verifyUserDto: VerifyUserDto) {
    const { email, otp, ...deviceInfo } = verifyUserDto;

    const userAlreadyExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userAlreadyExists) {
      throw new NotFoundException('Nenhum utilizador encontrado');
    }

    if (userAlreadyExists.verifiedAt) {
      throw new BadRequestException('Conta já verificada.');
    }

    if (userAlreadyExists.isBanned) {
      throw new ForbiddenException('Esta conta encontra-se bloqueada.');
    }

    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: userAlreadyExists.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException(
        'Código de verificação inválido ou expirado',
      );
    }

    const isOtpValid = await argon2.verify(otpRecord.codeHash, String(otp));

    if (!isOtpValid) {
      throw new BadRequestException(
        'Código de verificação inválido ou expirado',
      );
    }

    const user = await this.prisma.$transaction(async (prisma) => {
      await prisma.otp.delete({
        where: { id: otpRecord.id },
      });

      const verifiedUser = await prisma.user.update({
        where: { id: userAlreadyExists.id },
        data: {
          verifiedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });

      this.eventEmitter.emit('auth.user-verified', {
        userId: verifiedUser.id,
        email: verifiedUser.email,
        fullName: verifiedUser.fullName,
      });

      await prisma.auditLog.create({
        data: {
          action: 'user_verified',
          actorType: 'system',
          entityId: verifiedUser.id,
          entityType: 'user',
          payload: {
            email: verifiedUser.email,
          },
        },
      });

      return verifiedUser;
    });

    const tokens = await this.authService.generateTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      deviceInfo,
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      tokens,
    };
  }
}
