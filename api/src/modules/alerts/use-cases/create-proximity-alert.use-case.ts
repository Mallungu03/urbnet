import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateProximityAlertDto } from '../dto/create-proximity-alert.dto';
import { AlertRadiusService } from '../services/alert-radius.service';

@Injectable()
export class CreateProximityAlertUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertRadiusService: AlertRadiusService,
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
