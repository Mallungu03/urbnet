import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { FindManyQuery } from '@/shared/queries/find-many.query';
import { UploadService } from '@/modules/upload/upload.service';
import { UsersService } from '../services/users.service';

@Injectable()
export class FindManyUsersUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly userService: UsersService,
  ) {}

  async execute(query: FindManyQuery) {
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
          id: true,
          fullName: true,
          username: true,
          email: true,
          avatarSeed: true,
          avatarKey: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatarSeed: user.avatarSeed,
        avatarUrl: this.userService.buildAvatarUrl(
          user.avatarKey,
          this.uploadService,
        ),
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
