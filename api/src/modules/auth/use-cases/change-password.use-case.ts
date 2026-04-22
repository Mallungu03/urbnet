import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChangePasswordDto } from '../dto/change-password.dto';
import * as argon2 from 'argon2';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(email: string, changePasswordDto: ChangePasswordDto) {
    const userAlreadyExists = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!userAlreadyExists) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const { newPassword, oldPassword } = changePasswordDto;

    const oldPasswordHash = await argon2.verify(
      userAlreadyExists.passwordHash,
      oldPassword,
    );

    if (!oldPasswordHash) {
      throw new UnauthorizedException('A palavra-passe atual está incorreta.');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { email: email },
      data: { passwordHash },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'password_changed',
        actorType: 'system',
        actorId: userAlreadyExists.id,
        entityId: userAlreadyExists.id,
        entityType: 'user',
      },
    });

    this.eventEmitter.emit('auth.password-changed', {
      userId: userAlreadyExists.id,
      fullName: userAlreadyExists.fullName,
      email: userAlreadyExists.email,
    });

    return { message: 'Palavra-passe alterada com sucesso.' };
  }
}
