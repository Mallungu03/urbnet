import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateProximityAlertDto } from '../dto/create-proximity-alert.dto';
import { AlertRadiusService } from '../services/alert-radius.service';
import { AuditLogService } from '@/shared/audit/audit-log.service';

@Injectable()
export class CreateProximityAlertUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertRadiusService: AlertRadiusService,
    private readonly auditLog: AuditLogService,
  ) {}
  async execute(userId: string, param: CreateProximityAlertDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException();
    }
    const latitude = Number(param.latitude);
    const longitude = Number(param.longitude);

    const nearbyAlertZones =
      await this.alertRadiusService.notifyUserNearExistingAlertZones(
        user.id,
        user.email,
        user.fullName,
        latitude,
        longitude,
      );

    await this.auditLog.create({
      action: 'proximity_alert_checked',
      entityType: 'alert_zone',
      entityId: nearbyAlertZones[0]?.id ?? 'none',
      actorId: user.id,
      message:
        nearbyAlertZones.length > 0
          ? 'Alerta de proximidade enviado.'
          : 'Nenhuma zona proxima encontrada.',
      payload: {
        notifiedCount: nearbyAlertZones.length,
        latitude,
        longitude,
        radiusMeters: 1000,
        alertZoneIds: nearbyAlertZones.map((zone) => zone.id),
      },
    });

    return {
      notified: nearbyAlertZones.length > 0,
      notifiedCount: nearbyAlertZones.length,
      radiusMeters: 1000,
      proximityAlerts: nearbyAlertZones.map((zone) => ({
        alertZoneId: zone.id,
        reportId: zone.reportId,
        distanceMeters: zone.distanceMeters,
      })),
    };
  }
}
