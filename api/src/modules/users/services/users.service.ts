import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { UserAvatarStorageService } from './user-avatar-storage.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async generateEmailDeleted(email: string) {
    let newEmail = email;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { email } })) {
      newEmail = `${email}${counter++}`;
    }

    return newEmail;
  }

  async generateUserName(name: string) {
    const base = this.validateUserName(name);
    let username = `@${base}`;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `@${base}${counter++}`;
    }

    return username;
  }

  validateUserName(name: string) {
    const username = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    if (!username) throw new BadRequestException('Nome inválido.');

    return username;
  }

  buildAvatarUrl(
    avatarKey: string | null | undefined,
    storage: { getPublicUrl: (key: string) => string },
  ) {
    return avatarKey ? storage.getPublicUrl(avatarKey) : null;
  }

  buildAvatarValue(
    avatarSeed: string | null | undefined,
    avatarKey: string | null | undefined,
    storage: { getPublicUrl: (key: string) => string },
  ) {
    return avatarKey ? storage.getPublicUrl(avatarKey) : (avatarSeed ?? null);
  }
}
