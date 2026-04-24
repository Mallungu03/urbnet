import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AlertsService } from '../alerts.service';
import { PrismaService } from '@/config/db/prisma.service';

@Injectable()
export class ReportListener {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('report.created-risk')
  async createAlertZone(payload: {
    reportId: string;
    latitude: number;
    longitude: number;
  }) {
    const alertZone = await this.alertsService.createAlertZone(
      payload.reportId,
      payload.latitude,
      payload.longitude,
    );

    if (!alertZone) {
      return;
    }

    await this.alertsService.notifyUsersNearAlertZone(
      alertZone.id,
      payload.reportId,
      payload.latitude,
      payload.longitude,
      alertZone.radiusMeters,
    );
  }

  @OnEvent('report.updated-risk')
  async syncAlertZone(payload: {
    reportId: string;
    latitude: number;
    longitude: number;
  }) {
    const alertZone = await this.alertsService.upsertAlertZone(
      payload.reportId,
      payload.latitude,
      payload.longitude,
    );

    if (!alertZone) {
      return;
    }

    await this.alertsService.notifyUsersNearAlertZone(
      alertZone.id,
      payload.reportId,
      payload.latitude,
      payload.longitude,
      alertZone.radiusMeters,
    );
  }

  @OnEvent('report.deactivated-risk')
  async deactivateAlertZone(payload: { reportId: string }) {
    return (
      (await this.prisma.alertZone.update({
        where: { reportId: payload.reportId, deactivatedAt: null },
        data: { deactivatedAt: new Date(), updatedAt: new Date() },
        select: { id: true },
      })) ?? null
    );
  }
}
