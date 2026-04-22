import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { EnvService } from '../config/env/env.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly env: EnvService) {
    const databaseUrl = env.databaseUrl;
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Connected to the database successfully.');
    } catch (error) {
      console.error('Error connecting to the database:', error);
    }
  }

  async onModuleDestroy() {
    return this.$disconnect();
  }
}
