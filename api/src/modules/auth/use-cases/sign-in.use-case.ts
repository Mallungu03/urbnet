import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from '../auth.service';
import { SignInDto } from '../dto/sign-in.dto';
import * as argon2 from 'argon2';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { AuditLogService } from '@/shared/audit/audit-log.service';

@Injectable()
export class SignInUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(signInDto: SignInDto) {
    const email = signInDto.email;
    const password = signInDto.password;
    const deviceInfo = {
      fingerprint: signInDto.fingerprint,
      platform: signInDto.platform,
      deviceName: signInDto.deviceName,
      osVersion: signInDto.osVersion,
      appVersion: signInDto.appVersion,
      pushToken: signInDto.pushToken,
    };

    const userAllreadyExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userAllreadyExists) {
      throw new UnauthorizedException('Email ou palavra-passe inválidos.');
    }

    if (userAllreadyExists.deletedAt) {
      throw new NotFoundException('Esta conta já não está disponível.');
    }

    if (userAllreadyExists.isBanned) {
      throw new ForbiddenException('Esta conta encontra-se bloqueada.');
    }

    if (!userAllreadyExists.verifiedAt) {
      throw new ForbiddenException(
        'Conta ainda não verificada. Verifique seu email primeiramente.',
      );
    }

    const isPasswordValid = await argon2.verify(
      userAllreadyExists.passwordHash,
      String(password),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou palavra-passe inválidos.');
    }

    const tokens = await this.authService.generateTokens(
      {
        userId: userAllreadyExists.id,
        email: userAllreadyExists.email,
        role: userAllreadyExists.role,
      },
      deviceInfo,
    );

    await this.prisma.user.update({
      where: { id: userAllreadyExists.id },
      data: { lastActiveAt: new Date() },
    });

    this.eventEmitter.emit('auth.signed-in', {
      userId: userAllreadyExists.id,
      email: userAllreadyExists.email,
      fullName: userAllreadyExists.fullName,
      platform: String(signInDto.platform),
      deviceName: String(signInDto.deviceName),
    });

    await this.auditLog.create({
      action: 'user_signed_in',
      entityType: 'user',
      entityId: userAllreadyExists.id,
      actorId: userAllreadyExists.id,
      message: 'Sessao iniciada.',
      payload: {
        fingerprint: String(signInDto.fingerprint),
        platform: String(signInDto.platform),
        appVersion: String(signInDto.appVersion ?? null),
      },
    });

    return {
      ...tokens,
      id: userAllreadyExists.id,
      email: userAllreadyExists.email,
      fullName: userAllreadyExists.fullName,
      username: userAllreadyExists.username,
      role: userAllreadyExists.role,
    };
  }
}
