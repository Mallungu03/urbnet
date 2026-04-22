import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationChannel } from '@/generated/prisma/enums';

@Injectable()
export class AdminListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('admin.baned-user')
  async onUserBaned(payload: { id: string; email: string; fullName: string }) {
    await this.notificationService.send({
      userId: payload.id,
      email: payload.email,
      title: 'Usuário banido',
      channel: [NotificationChannel.email],
      body: `Olá ${payload.fullName}, por algum motivo, foste banido  e não estás autorizado a utilizar a Reporta!. Caso seja indevido, entre em contacto com o suporte`,
      template: 'baned-user',
      templateData: { fullName: payload.fullName, email: payload.email },
      type: 'baned_user',
    });
  }

  @OnEvent('admin.unbaned-user')
  async onUserUnbaned(payload: {
    id: string;
    email: string;
    fullName: string;
  }) {
    await this.notificationService.send({
      userId: payload.id,
      email: payload.email,
      title: 'Usuário banido',
      channel: [NotificationChannel.email],
      body: `Olá ${payload.fullName}, deixaste de ser banido  e já estás autorizado a utilizar a Reporta!.`,
      template: 'unbaned-user',
      templateData: { fullName: payload.fullName, email: payload.email },
      type: 'unbaned_user',
    });
  }
}
