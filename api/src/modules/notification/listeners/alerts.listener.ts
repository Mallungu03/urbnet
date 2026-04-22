import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AlertListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('alerts.created-proximity-alert')
  async sendOnProximityAlert(payload: {
    userId: string;
    proximityAlertId: string;
    alertZoneId: string;
  }) {
    // enviar notificação de alerta para zona de alerta
  }
}
