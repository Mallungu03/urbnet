import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

@Injectable()
export class EnvService {
  constructor(private readonly config: ConfigService) {}

  get apiUrl(): string {
    return this.config.get<string>('api.url')!;
  }

  get apiPort(): number {
    return this.config.get<number>('api.port')!;
  }

  get apiHost(): string {
    return this.config.get<string>('api.host')!;
  }

  get databaseUrl(): string {
    return this.config.get<string>('database.url')!;
  }

  get smtpUser(): string {
    return this.config.get<string>('smtp.user')!;
  }

  get smtpPass(): string {
    return this.config.get<string>('smtp.pass')!;
  }

  get smtpHost(): string {
    return this.config.get<string>('smtp.host')!;
  }

  get smtpPort(): number {
    return this.config.get<number>('smtp.port')!;
  }

  get smtpSecure(): boolean {
    return this.config.get<boolean>('smtp.secure')!;
  }

  get smtpFrom(): string {
    return this.config.get<string>('smtp.from')!;
  }

  get jwtAccessSecret(): string {
    return this.config.get<string>('jwt.accessSecret')!;
  }

  get jwtRefreshSecret(): string {
    return this.config.get<string>('jwt.refreshSecret')!;
  }

  get jwtAccessExpiresIn(): StringValue {
    return this.config.get<string>('jwt.accessExpiresIn') as StringValue;
  }

  get jwtRefreshExpiresIn(): StringValue {
    return this.config.get<string>('jwt.refreshExpiresIn') as StringValue;
  }
}
