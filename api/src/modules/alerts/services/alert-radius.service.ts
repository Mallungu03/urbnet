import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@/generated/prisma/enums';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { NotificationService } from '@/modules/notification/notification.service';

type NearbyAlertZone = {
  id: string;
  reportId: string;
  distanceMeters: number;
  radiusMeters: number;
};

type NearbyUser = {
  id: string;
  email: string;
  fullName: string;
};

@Injectable()
export class AlertRadiusService {
  private static readonly DEFAULT_RADIUS_METERS = 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createAlertZone(
    reportId: string,
    latitude: number,
    longitude: number,
    radiusMeters = AlertRadiusService.DEFAULT_RADIUS_METERS,
  ) {
    const [alertZone] = await this.prisma.$queryRaw<
      Array<{
        id: string;
        reportId: string;
        radiusMeters: number;
        totalNotified: number;
        createdAt: Date;
      }>
    >`
      INSERT INTO "AlertZone" ("reportId", "center", "radiusMeters", "totalNotified")
      VALUES (
        ${reportId},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        ${radiusMeters},
        0
      )
      ON CONFLICT ("reportId") DO NOTHING
      RETURNING "id", "reportId", "radiusMeters", "totalNotified", "createdAt"
    `;

    return alertZone ?? null;
  }

  async notifyUsersNearAlertZone(
    alertZoneId: string,
    reportId: string,
    latitude: number,
    longitude: number,
    radiusMeters = AlertRadiusService.DEFAULT_RADIUS_METERS,
  ) {
    const users = await this.prisma.$queryRaw<NearbyUser[]>`
      SELECT DISTINCT
        u."id",
        u."email",
        u."fullName"
      FROM "User" u
      INNER JOIN "Report" r
        ON r."userId" = u."id"
      LEFT JOIN "ProximityAlert" pa
        ON pa."userId" = u."id"
       AND pa."alertZoneId" = ${alertZoneId}
      WHERE u."deletedAt" IS NULL
        AND u."isBanned" = false
        AND r."deletedAt" IS NULL
        AND pa."id" IS NULL
        AND ST_DWithin(
          r."location"::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
    `;

    if (users.length === 0) {
      return { notifiedUsers: 0 };
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.proximityAlert.createMany({
        data: users.map((user) => ({
          alertZoneId,
          userId: user.id,
          sentAt: new Date(),
        })),
        skipDuplicates: true,
      });

      await prisma.alertZone.update({
        where: { id: alertZoneId },
        data: { totalNotified: { increment: users.length } },
      });
    });

    await Promise.all(
      users.map((user) =>
        this.notificationService.send({
          userId: user.id,
          email: user.email,
          reportId,
          alertZoneId,
          title: 'Zona de alerta proxima',
          body: `Olá ${user.fullName}, identificámos uma zona de alerta a menos de ${radiusMeters} metros da sua área.`,
          channel: [NotificationChannel.in_app],
        }),
      ),
    );

    return { notifiedUsers: users.length };
  }

  async notifyUserNearExistingAlertZones(
    userId: string,
    email: string,
    fullName: string,
    latitude: number,
    longitude: number,
  ) {
    const nearbyZones = await this.prisma.$queryRaw<NearbyAlertZone[]>`
      SELECT
        az."id",
        az."reportId",
        az."radiusMeters",
        ROUND(
          ST_Distance(
            az."center"::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          )
        )::int AS "distanceMeters"
      FROM "AlertZone" az
      LEFT JOIN "ProximityAlert" pa
        ON pa."alertZoneId" = az."id"
       AND pa."userId" = ${userId}
      WHERE az."deactivatedAt" IS NULL
        AND pa."id" IS NULL
        AND ST_DWithin(
          az."center"::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${AlertRadiusService.DEFAULT_RADIUS_METERS}
        )
    `;

    if (nearbyZones.length === 0) {
      return [];
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.proximityAlert.createMany({
        data: nearbyZones.map((zone) => ({
          alertZoneId: zone.id,
          userId,
          sentAt: new Date(),
        })),
        skipDuplicates: true,
      });

      for (const zone of nearbyZones) {
        await prisma.alertZone.update({
          where: { id: zone.id },
          data: { totalNotified: { increment: 1 } },
        });
      }
    });

    await Promise.all(
      nearbyZones.map((zone) =>
        this.notificationService.send({
          userId,
          email,
          reportId: zone.reportId,
          alertZoneId: zone.id,
          title: 'Zona de alerta detectada',
          body: `Olá ${fullName}, existe uma zona de alerta a ${zone.distanceMeters} metros da sua localização atual.`,
          channel: [NotificationChannel.in_app],
        }),
      ),
    );

    return nearbyZones;
  }
}
