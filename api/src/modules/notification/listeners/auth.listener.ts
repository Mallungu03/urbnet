import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { NotificationChannel } from '@/generated/enums';

@Injectable()
export class AuthListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('auth.user-registered')
  async onSendUserRegistered(payload: {
    userId: string;
    fullName: string;
    email: string;
    otp: string;
  }) {
    await this.notificationService
      .send({
        userId: payload.userId,
        title: 'Verificação de email — Reporta Team',
        body: `Olá ${payload.fullName}, o seu código de verificação é: ${payload.otp}. Válido por 15 minutos.`,
        channel: [NotificationChannel.email],
        template: 'user-registered',
        templateData: {
          otp: payload.otp,
          fullName: payload.fullName,
          title: 'Verificação de email — Reporta Team',
          body: `Olá ${payload.fullName}, o seu código de verificação é: ${payload.otp}. Válido por 15 minutos.`,
        },
        email: payload.email,
      })
      .catch((e: { message: string }) => console.error(e.message));
  }

  @OnEvent('auth.user-verified')
  async onUserVerified(payload: {
    userId: string;
    fullName: string;
    email: string;
  }) {
    await this.notificationService.send({
      userId: payload.userId,
      title: 'Conta verificada com sucesso',
      body: `Olá ${payload.fullName}, a tua conta foi verificada e já podes usar a plataforma.`,
      channel: [NotificationChannel.email],
      template: 'user-verified',
      templateData: { fullName: payload.fullName },
      email: payload.email,
    });
  }

  @OnEvent('auth.otp-resent')
  async onOtpResent(payload: {
    userId: string;
    fullName: string;
    email: string;
    otp: string;
  }) {
    await this.notificationService.send({
      userId: payload.userId,
      title: 'Novo código de verificação',
      body: `Olá ${payload.fullName}, o teu novo código de verificação é ${payload.otp}.`,
      channel: [NotificationChannel.email],
      template: 'otp-resent',
      templateData: { fullName: payload.fullName, otp: payload.otp },
      email: payload.email,
    });
  }

  @OnEvent('auth.forgot-password')
  async onForgotPassword(payload: {
    userId: string;
    fullName: string;
    email: string;
    otp: string;
  }) {
    await this.notificationService.send({
      userId: payload.userId,
      title: 'Recuperação de palavra-passe',
      body: `Olá ${payload.fullName}, usa o código ${payload.otp} para redefinir a tua palavra-passe.`,
      channel: [NotificationChannel.email],
      template: 'forgot-password',
      templateData: { fullName: payload.fullName, otp: payload.otp },
      email: payload.email,
    });
  }

  @OnEvent('auth.password-reset')
  async onPasswordReset(payload: {
    userId: string;
    fullName: string;
    email: string;
  }) {
    await this.notificationService.send({
      userId: payload.userId,
      title: 'Palavra-passe redefinida',
      body: `Olá ${payload.fullName}, a tua palavra-passe foi redefinida com sucesso.`,
      channel: [NotificationChannel.email],
      template: 'password-reset',
      templateData: { fullName: payload.fullName },
      email: payload.email,
    });
  }

  @OnEvent('auth.password-changed')
  async onPasswordChanged(payload: {
    userId: string;
    fullName: string;
    email: string;
  }) {
    await this.notificationService.send({
      userId: payload.userId,
      title: 'Palavra-passe alterada',
      body: `Olá ${payload.fullName}, a tua palavra-passe foi alterada com sucesso.`,
      channel: [NotificationChannel.email],
      template: 'password-changed',
      templateData: { fullName: payload.fullName },
      email: payload.email,
    });
  }

  @OnEvent('auth.signed-in')
  async onSignedIn(payload: {
    userId: string;
    fullName: string;
    email: string;
    platform: string;
    deviceName?: string;
  }) {
    await this.notificationService.send({
      userId: payload.userId,
      title: 'Novo início de sessão',
      body: `Olá ${payload.fullName}, Detetámos um acesso na tua conta via ${payload.deviceName ?? payload.platform}.`,
      channel: [NotificationChannel.email],
      template: 'signed-in',
      templateData: {
        fullName: payload.fullName,
        platform: payload.platform,
        deviceName: payload.deviceName ?? payload.platform,
      },
      email: payload.email,
    });
  }
}
