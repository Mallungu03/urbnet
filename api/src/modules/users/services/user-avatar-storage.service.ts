import { Injectable } from '@nestjs/common';
import { EnvService } from '@/config/env/env.service';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

@Injectable()
export class UserAvatarStorageService {
  private readonly uploadsRoot = join(process.cwd(), 'storage', 'uploads');
  constructor(private readonly envService: EnvService) {}

  async saveAvatar(fileKey: string, buffer: Buffer) {
    const filePath = this.resolveStoragePath(fileKey);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
  }

  async deleteAvatar(fileKey: string) {
    const filePath = this.resolveStoragePath(fileKey);

    await rm(filePath, { force: true });
  }

  getPublicUrl(fileKey: string) {
    const normalizedKey = fileKey.replace(/\\/g, '/');
    return `${this.envService.apiUrl}/uploads/${normalizedKey}`;
  }

  private resolveStoragePath(fileKey: string) {
    return join(this.uploadsRoot, fileKey);
  }
}
