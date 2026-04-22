import { EnvService } from '@/shared/config/env.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefresTokenDto } from '../dto/refresh-token.dto';
import { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import * as argon2 from 'argon2';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
    private readonly authService: AuthService,
  ) {}

  async execute(refreshTokenDto: RefresTokenDto) {
    const { refreshToken, ...deviceInfo } = refreshTokenDto;

    let payload: IJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<IJwtPayload>(refreshToken, {
        secret: this.envService.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { publicId: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Utilizador não encontrado.');
    }

    const device = await this.prisma.device.findFirst({
      where: {
        userId: user.id,
        fingerprint: String(deviceInfo.fingerprint),
        revokedAt: null,
      },
      select: { id: true },
    });

    if (!device) {
      throw new UnauthorizedException(
        'Nenhum dispositivo ativo para esta sessão.',
      );
    }

    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: user.id,
        deviceId: device.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let matchedToken: {
      id: bigint;
      deviceId: bigint | null;
    } | null = null;

    for (const storedToken of activeTokens) {
      const isValid = await argon2.verify(storedToken.tokenHash, refreshToken);

      if (isValid) {
        matchedToken = {
          id: storedToken.id,
          deviceId: storedToken.deviceId,
        };
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException(
        'O refresh token foi revogado ou já não existe.',
      );
    }

    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.authService.generateTokens(
      {
        userId: user.id,
        email: user.email,
        publicId: user.publicId,
        role: user.role,
      },
      deviceInfo,
    );

    await this.prisma.auditLog.create({
      data: {
        action: 'token_refreshed',
        actorType: 'system',
        actorId: user.id,
        entityId: user.id,
        entityType: 'user',
        payload: {
          fingerprint: String(deviceInfo.fingerprint),
          platform: String(deviceInfo.platform),
        },
      },
    });

    return tokens;
  }
}
