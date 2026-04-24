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

type AuthenticatedRequest = Request & {
  user?: IJwtPayload;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtStrategy: JwtStrategy,
    private reflector: Reflector,
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
    request.user = payload;

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
