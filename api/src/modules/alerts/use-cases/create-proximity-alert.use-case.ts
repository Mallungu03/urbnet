import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/config/db/prisma.service';
import { CreateProximityAlertDto } from '../dto/create-proximity-alert.dto';
import { AlertsService } from '../alerts.service';

@Injectable()
export class CreateProximityAlertUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  async execute(userId: string, param: CreateProximityAlertDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const latitude = Number(param.latitude);
    const longitude = Number(param.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new BadRequestException('Latitude e longitude inválidas.');
    }

    const nearbyAlertZones =
      await this.alertsService.notifyUserNearExistingAlertZones(
        user.id,
        user.email,
        user.fullName,
        latitude,
        longitude,
      );

    if (nearbyAlertZones.length > 0) {
      await this.prisma.auditLog.create({
        data: {
          action: 'proximity_alert_checked',
          entityType: 'alert_zone',
          entityId: nearbyAlertZones[0]?.id ?? 'none',
          actorId: user.id,
          actorType: 'user',
          payload: {
            notifiedCount: nearbyAlertZones.length,
            latitude,
            longitude,
            radiusMeters: 1000,
            alertZoneIds: nearbyAlertZones.map((zone) => zone.id),
          },
        },
      });
    }

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
