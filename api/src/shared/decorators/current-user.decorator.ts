import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import type { IJwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IJwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user?: IJwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new BadRequestException('User not found in request');
    }

    return user;
  },
);
