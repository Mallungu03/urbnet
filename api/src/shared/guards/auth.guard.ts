import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Request } from 'express';
import { Role, ROLES_KEY } from '../decorators/roles.decorators';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtStrategy } from '@/modules/auth/strategies/jwt-strategy';
import { PrismaService } from '@/config/db/prisma.service';

type AuthenticatedRequest = Request & {
  user?: IJwtPayload;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtStrategy: JwtStrategy,
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException('Token não encontrado');

    const payload: IJwtPayload = await this.jwtStrategy.validateToken(token);

    // Validar usuário no banco de dados
    const dbUser = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isBanned: true, deletedAt: true, role: true },
    });

    if (!dbUser || dbUser.isBanned || dbUser.deletedAt) {
      throw new UnauthorizedException('Utilizador inválido ou suspenso');
    }

    request.user = { ...payload, role: dbUser.role };

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Utilizador não autenticado');
    }
    const hasRole = requiredRoles.some((role) => user.role === String(role));

    if (!hasRole) {
      throw new ForbiddenException('Acesso negado: privilégios insuficientes');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
