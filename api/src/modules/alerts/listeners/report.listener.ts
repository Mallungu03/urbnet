import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AlertRadiusService } from '../services/alert-radius.service';

@Injectable()
export class ReportListener {
  constructor(private readonly alertRadiusService: AlertRadiusService) {}

  @OnEvent('report.created-risk')
  async createAlertZone(payload: {
    reportId: string;
    latitude: number;
    longitude: number;
  }) {
    const alertZone = await this.alertRadiusService.createAlertZone(
      payload.reportId,
      payload.latitude,
      payload.longitude,
    );

    if (!alertZone) {
      return;
    }

    await this.alertRadiusService.notifyUsersNearAlertZone(
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
    const alertZone = await this.alertRadiusService.upsertAlertZone(
      payload.reportId,
      payload.latitude,
      payload.longitude,
    );

    if (!alertZone) {
      return;
    }

    await this.alertRadiusService.notifyUsersNearAlertZone(
      alertZone.id,
      payload.reportId,
      payload.latitude,
      payload.longitude,
      alertZone.radiusMeters,
    );
  }

  @OnEvent('report.deactivated-risk')
  async deactivateAlertZone(payload: { reportId: string }) {
    await this.alertRadiusService.deactivateAlertZoneByReportId(payload.reportId);
  }
}
