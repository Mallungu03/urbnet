import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { OnEvent } from '@nestjs/event-emitter';
import { NearbyAlertZone } from '@/shared/types/all.types';

@Injectable()
export class AlertListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('alerts.created-proximity-alert')
  async sendOnProximityAlert(payload: {
    users: [{ id: string; email: string; fullName: string }];
    radiusMeters;
    reportId: string;
    alertZoneId: string;
  }) {
    await Promise.all(
      payload.users.map((user) =>
        this.notificationService.send({
          userId: String(user.id),
          email: user.email,
          reportId: payload.reportId,
          alertZoneId: payload.alertZoneId,
          title: 'Zona de alerta proxima',
          body: `Olá ${String(user.fullName)}, identificámos uma zona de alerta a menos de ${payload.radiusMeters} metros da sua área.`,
          channel: ['email', 'in_app', 'push'],
        }),
      ),
    );
  }

  @OnEvent('alerts.notifyUserAlertZones')
  async sendOnUserProximityAlert(payload: {
    nearbyZones: [NearbyAlertZone];
    userId: string;
    email: string;
    fullName: string;
  }) {
    await Promise.all(
      payload.nearbyZones.map((zone) =>
        this.notificationService.send({
          userId: payload.userId,
          email: payload.email,
          reportId: zone.reportId,
          alertZoneId: zone.id,
          title: 'Zona de alerta detectada',
          body: `Olá ${payload.fullName}, existe uma zona de alerta a ${zone.distanceMeters} metros da sua localização atual.`,
          channel: ['email', 'in_app', 'push'],
        }),
      ),
    );
  }
}
