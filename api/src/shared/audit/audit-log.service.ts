import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { AuditActorType } from '@/generated/prisma/enums';
import { PrismaService } from '@/shared/prisma/prisma.service';

type AuditClient = Prisma.TransactionClient | PrismaService;

type AuditPayload = Record<string, unknown>;

interface CreateAuditLogParams {
  action: string;
  entityType: string;
  entityId: string | number | bigint;
  message: string;
  actorType?: AuditActorType;
  actorId?: string | null;
  payload?: AuditPayload;
  client?: AuditClient;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    action,
    entityType,
    entityId,
    message,
    actorType = AuditActorType.system,
    actorId,
    payload,
    client,
  }: CreateAuditLogParams) {
    const auditClient = client ?? this.prisma;

    await auditClient.auditLog.create({
      data: {
        action,
        entityType,
        entityId: String(entityId),
        actorType,
        actorId,
        payload: {
          message,
          ...(payload ?? {}),
        },
      },
    });
  }
}
