import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return `This action returns all admin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }

  async generateSlugDeleted(name: string): Promise<string> {
    const base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    if (!base) throw new BadRequestException('Slug inválido.');

    let slug = `@${base}`;
    let counter = 1;

    while (await this.prisma.category.findUnique({ where: { slug } })) {
      slug = `@${base}${counter++}`;
    }

    return slug;
  }
}
