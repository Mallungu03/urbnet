import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { PrismaService } from '@/config/db/prisma.service';
import * as argon2 from 'argon2';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from '../auth.service';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
  ) {}

  async execute(registerDto: RegisterDto) {
    const email = String(registerDto.email);
    const fullName = String(registerDto.fullName);
    const password = String(registerDto.password);

    const userAllreadyExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userAllreadyExists) {
      throw new ConflictException(
        'Já existe uma conta registada com este email.',
      );
    }

    const passwordHash = await argon2.hash(password);
    const username = await this.authService.generateUserName(fullName);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await this.prisma.$transaction(async (prisma) => {
      const createdUser = await prisma.user.create({
        data: {
          email,
          fullName,
          password: passwordHash,
          username,
        },
      });

      await prisma.otp.create({
        data: {
          userId: createdUser.id,
          codeHash: await argon2.hash(otp),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      return {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        username: createdUser.username,
        role: createdUser.role,
      };
    });

    this.eventEmitter.emit('auth.user-registered', {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      otp,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'user_registered',
        entityType: 'user',
        entityId: user.id,
        actorType: 'user',
        payload: {
          message: 'Conta registada.',
          email: user.email,
          username: user.username,
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
    };
  }
}
