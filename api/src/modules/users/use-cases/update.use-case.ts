import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { UserAvatarStorageService } from '../services/user-avatar-storage.service';
import { UsersService } from '../services/users.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly prisma: PrismaService,

    private readonly userAvatarStorage: UserAvatarStorageService,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    authId: string,
    targetId: string,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    if (authId !== targetId) {
      throw new ForbiddenException('Só podes atualizar o teu próprio perfil.');
    }

    const userAlreadExistis = await this.prisma.user.findUnique({
      where: { id: authId },
    });

    if (!userAlreadExistis) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const avatarSeed = String(updateUserDto.avatarSeed).trim();
    const fullName = String(updateUserDto.fullName).trim();
    const username = String(updateUserDto.username).trim();

    const dataToUpdate: {
      avatarSeed?: string;
      avatarKey?: string | null;
      fullName?: string;
      username?: string;
    } = {};

    let nextAvatarFileKey: string | null = null;
    let previousAvatarKeyToDelete: string | null = null;

    if (fullName !== undefined) {
      dataToUpdate.fullName = fullName;
    }

    if (avatarSeed !== undefined) {
      dataToUpdate.avatarSeed = avatarSeed;
    }

    if (username !== undefined) {
      dataToUpdate.username = this.usersService.validateUserName(username);
      const usernameAlreadExistis = await this.prisma.user.findFirst({
        where: {
          username,
          id: { not: authId },
        },
      });

      if (usernameAlreadExistis) {
        throw new ConflictException('Username indisponível.');
      }
    }

    if (file?.buffer) {
      const image = sharp(file.buffer);
      const optimizedBuffer = await image
        .resize({
          width: 800,
          height: 800,
          fit: 'cover',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 82 })
        .toBuffer();

      nextAvatarFileKey = `avatars/${userAlreadExistis.id}/${randomUUID()}.jpg`;
      await this.userAvatarStorage.saveAvatar(
        nextAvatarFileKey,
        optimizedBuffer,
      );
      dataToUpdate.avatarKey = nextAvatarFileKey;
      previousAvatarKeyToDelete = userAlreadExistis.avatarKey;
    }

    if (!Object.keys(dataToUpdate).length) {
      throw new BadRequestException(
        'Pelo menos um campo deve ser informado para atualização.',
      );
    }

    const user = await (async () => {
      try {
        return await this.prisma.user.update({
          where: { id: userAlreadExistis.id },
          data: dataToUpdate,
        });
      } catch (error) {
        if (nextAvatarFileKey) {
          await this.userAvatarStorage.deleteAvatar(nextAvatarFileKey);
        }

        throw error;
      }
    })();

    if (
      previousAvatarKeyToDelete &&
      previousAvatarKeyToDelete !== nextAvatarFileKey
    ) {
      await this.userAvatarStorage.deleteAvatar(previousAvatarKeyToDelete);
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'user_profile_updated',
        entityType: 'user',
        entityId: user.id,
        actorId: user.id,
        actorType: 'system',
        payload: dataToUpdate,
      },
    });

    return {
      id: user.id,
      avatar: this.usersService.buildAvatarValue(
        user.avatarSeed,
        user.avatarKey,
        this.userAvatarStorage,
      ),
      avatarSeed: user.avatarSeed,
      avatarUrl: this.usersService.buildAvatarUrl(
        user.avatarKey,
        this.userAvatarStorage,
      ),
      email: user.email,
      fullName: user.fullName,
      username: user.username,
    };
  }
}
