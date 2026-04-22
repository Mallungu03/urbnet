import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ReportListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('report.confirmed')
  async sendReportConfirmed(payload: {
    userId: string;
    fullName: string;
    userConfirmedId: string;
    userConfirmedemail: string;
    userConfirmedFullName: string;
  }) {
    await this.notificationService.send({
      userId: payload.userConfirmedId,
      title: 'Report Confirmado',
      body: `Olá ${payload.userConfirmedFullName}, acabaste de receber uma confirmação de sua reportagem por ${payload.fullName}.`,
      channel: ['push', 'in_app', 'email'],
      template: 'otp-resent',
      templateData: { payload },
      email: payload.userConfirmedemail,
    });
  }
}
