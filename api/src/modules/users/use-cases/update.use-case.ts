import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuditLogService } from '@/shared/audit/audit-log.service';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { UserAvatarStorageService } from '../services/user-avatar-storage.service';
import {
  buildAvatarUrl,
  buildAvatarValue,
} from '../utils/user-avatar-response.util';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly userAvatarStorage: UserAvatarStorageService,
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

    const avatarSeed = updateUserDto.avatarSeed?.trim();
    const fullName = updateUserDto.fullName?.trim();
    const username = updateUserDto.username?.trim();

    const dataToUpdate: {
      avatarSeed?: string;
      avatarKey?: string | null;
      fullName?: string;
      username?: string;
    } = {};

    const changedFields: string[] = [];
    let nextAvatarFileKey: string | null = null;
    let previousAvatarKeyToDelete: string | null = null;

    if (fullName !== undefined) {
      dataToUpdate.fullName = fullName;
      changedFields.push('fullName');
    }

    if (avatarSeed !== undefined) {
      dataToUpdate.avatarSeed = avatarSeed;
      changedFields.push('avatarSeed');
    }

    if (username !== undefined) {
      dataToUpdate.username = await this.validateUserName(
        username,
        userAlreadExistis.id,
      );
      changedFields.push('username');
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
      await this.userAvatarStorage.saveAvatar(nextAvatarFileKey, optimizedBuffer);
      dataToUpdate.avatarKey = nextAvatarFileKey;
      previousAvatarKeyToDelete = userAlreadExistis.avatarKey;
      changedFields.push('avatar');
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

    await this.auditLog.create({
      action: 'user_profile_updated',
      entityType: 'user',
      entityId: user.id,
      actorId: user.id,
      message: 'Perfil atualizado.',
      payload: {
        fields: changedFields,
      },
    });

    return {
      id: user.id,
      avatar: buildAvatarValue(
        user.avatarSeed,
        user.avatarKey,
        this.userAvatarStorage,
      ),
      avatarSeed: user.avatarSeed,
      avatarUrl: buildAvatarUrl(user.avatarKey, this.userAvatarStorage),
      email: user.email,
      fullName: user.fullName,
      username: user.username,
    };
  }

  private async validateUserName(username: string, currentUserId: string) {
    if (
      !username
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20)
    ) {
      throw new BadRequestException('Username inválido.');
    }

    const usernmaeAlreadExistis = await this.prisma.user.findFirst({
      where: {
        username,
        id: { not: currentUserId },
      },
    });

    if (usernmaeAlreadExistis) {
      throw new ConflictException('Username indisponível.');
    }
    return username;
  }
}
