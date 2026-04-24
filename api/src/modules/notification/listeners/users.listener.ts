import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { NotificationChannel } from '@/generated/enums';

@Injectable()
export class UserListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('user.followed')
  async onUserFollowed(payload: {
    userId: string;
    followerName: string;
    followerId: string;
    email: string;
    fullName?: string;
  }) {
    await this.notificationService.send({
      userId: payload.userId,
      title: 'Novo seguidor',
      body: `${payload.followerName} começou a seguir-te.`,
      channel: [NotificationChannel.in_app],
      template: 'user-followed',
      templateData: {
        fullName: payload.fullName ?? 'utilizador',
        followerName: payload.followerName,
      },
      email: payload.email,
    });
  }

  @OnEvent('user.deleted')
  async onUserDeleted(payload: {
    userId: string;
    fullName: string;
    email: string;
  }) {
    await this.notificationService.send({
      userId: payload.userId,
      title: 'Conta encerrada',
      body: `Olá ${payload.fullName}, a tua conta foi encerrada com sucesso.`,
      channel: [NotificationChannel.email],
      template: 'user-deleted',
      templateData: { fullName: payload.fullName },
      email: payload.email,
    });
  }
}
