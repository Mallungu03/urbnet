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
import { PrismaService } from '@/config/db/prisma.service';

@Injectable()
export class SignInUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
  ) {}

  async execute(signInDto: SignInDto) {
    const email = String(signInDto.email);
    const password = String(signInDto.password);
    const deviceInfo = {
      fingerprint: String(signInDto.fingerprint),
      platform: String(signInDto.platform),
      deviceName: String(signInDto.deviceName),
      osVersion: String(signInDto.osVersion),
      appVersion: String(signInDto.appVersion),
      pushToken: String(signInDto.pushToken),
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
      userAllreadyExists.password,
      password,
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

    const total = await this.prisma.device.count({
      where: {
        userId: userAllreadyExists.id,
        fingerprint: deviceInfo.fingerprint,
        revokedAt: null,
      },
    });

    if (total !== 0) {
      this.eventEmitter.emit('auth.signed-in', {
        userId: userAllreadyExists.id,
        email: userAllreadyExists.email,
        fullName: userAllreadyExists.fullName,
        platform: deviceInfo.platform,
        deviceName: deviceInfo.deviceName,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'user_signed_in',
        entityType: 'user',
        entityId: userAllreadyExists.id,
        actorId: userAllreadyExists.id,
        actorType: 'user',
        payload: {
          message: 'Sessao iniciada.',
          fingerprint: deviceInfo.fingerprint,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion ?? null,
        },
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
