import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { EnvService } from '@/config/env/env.service';
import { DeviceSessionDto } from './dto/device-session.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async generateTokens(
    dto: {
      userId: string;
      email: string;
      role: string;
    },
    deviceDto: DeviceSessionDto,
  ) {
    const jti = uuidv4();

    const payload: IJwtPayload = {
      sub: dto.userId,
      email: dto.email,
      role: dto.role,
      jti,
      fingerprint: String(deviceDto.fingerprint),
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.envService.jwtRefreshSecret,
      expiresIn: this.envService.jwtRefreshExpiresIn,
    });

    const refreshTokenHash = await argon2.hash(refreshToken);
    const device = await this.upsertDevice(dto.userId, deviceDto);

    await this.prisma.refreshToken.create({
      data: {
        userId: dto.userId,
        tokenHash: refreshTokenHash,
        deviceId: device.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async generateUserName(name: string): Promise<string> {
    const base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    if (!base) throw new BadRequestException('Nome inválido.');

    let username = `@${base}`;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `@${base}${counter++}`;
    }

    return username;
  }

  async upsertDevice(userId: string, deviceDto: DeviceSessionDto) {
    return await this.prisma.device.upsert({
      where: {
        userId_fingerprint: {
          userId,
          fingerprint: String(deviceDto.fingerprint),
        },
      },
      create: {
        userId,
        fingerprint: String(deviceDto.fingerprint),
        platform: String(deviceDto.platform),
        deviceName: String(deviceDto.deviceName),
        osVersion: String(deviceDto.osVersion),
        appVersion: String(deviceDto.appVersion),
        pushToken: String(deviceDto.pushToken),
        lastSeenAt: new Date(),
        revokedAt: null,
      },
      update: {
        platform: String(deviceDto.platform),
        deviceName: String(deviceDto.deviceName),
        osVersion: String(deviceDto.osVersion),
        appVersion: String(deviceDto.appVersion),
        pushToken: String(deviceDto.pushToken),
        pushTokenUpdatedAt: deviceDto.pushToken ? new Date() : undefined,
        lastSeenAt: new Date(),
        revokedAt: null,
      },
    });
  }
}
