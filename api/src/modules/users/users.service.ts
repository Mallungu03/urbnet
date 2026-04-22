import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

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
}
