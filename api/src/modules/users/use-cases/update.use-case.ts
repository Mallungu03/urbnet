import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    authId: string,
    targetId: string,
    updateUserDto: UpdateUserDto,
  ) {
    if (authId !== targetId) {
      throw new ForbiddenException('Só podes atualizar o teu próprio perfil.');
    }

    const userAlreadExistis = await this.prisma.user.findUnique({
      where: { publicId: authId },
    });

    if (!userAlreadExistis) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const avatarSeed = String(updateUserDto.avatarSeed);
    const fullName = String(updateUserDto.fullName);
    const username = String(updateUserDto.username);

    const dataToUpdate: {
      avatarSeed?: string;
      fullName?: string;
      username?: string;
    } = {};

    if (fullName !== undefined) {
      dataToUpdate.fullName = fullName;
    }

    if (avatarSeed !== undefined) {
      dataToUpdate.avatarSeed = avatarSeed;
    }

    if (username !== undefined) {
      dataToUpdate.username = await this.validateUserName(
        username,
        userAlreadExistis.id,
      );
    }

    if (!Object.keys(dataToUpdate).length) {
      throw new BadRequestException(
        'Pelo menos um campo deve ser informado para atualização.',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userAlreadExistis.id },
      data: dataToUpdate,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'user_profile_updated',
        actorType: 'system',
        actorId: user.id,
        entityId: user.id,
        entityType: 'user',
      },
    });

    return {
      id: user.publicId,
      avatarSeed: user.avatarSeed,
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
