import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { IJwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { EnvService } from '@/config/env/env.service';

@Injectable()
export class JwtStrategy {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
    private readonly prisma: PrismaService,
  ) {}

  async validateToken(token: string): Promise<IJwtPayload> {
    let payload: IJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<IJwtPayload>(token, {
        secret: this.envService.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Sessão inválida para este utilizador.');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Esta conta encontra-se bloqueada.');
    }

    if (!user.verifiedAt) {
      throw new ForbiddenException('A conta ainda não foi verificada.');
    }

    return {
      ...payload,
      email: user.email,
      role: user.role,
    };
  }
}
