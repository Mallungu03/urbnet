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

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtStrategy: JwtStrategy,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Extração e Validação do Token (Obrigatório para qualquer rota não pública)
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException('Token não encontrado');

    const payload: IJwtPayload = await this.jwtStrategy.validateToken(token);
    request['user'] = payload;

    // 3. Verificação de Roles (Autorização)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    // Verifica se o utilizador tem pelo menos um dos roles necessários
    const user = request['user'];
    const hasRole = requiredRoles.some((role) => user.role === role);

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
