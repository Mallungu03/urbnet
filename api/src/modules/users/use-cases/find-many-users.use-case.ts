import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { FindManyQueryDto } from '@/shared/queries/find-many.query';

@Injectable()
export class FindManyUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindManyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where = {
      isBanned: false,
      deletedAt: null,
      verifiedAt: { not: null as null | Date },
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { username: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          publicId: true,
          fullName: true,
          username: true,
          email: true,
          avatarSeed: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.publicId,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatarSeed: user.avatarSeed,
        createdAt: user.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
