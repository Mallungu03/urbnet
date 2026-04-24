import { Injectable, Logger } from '@nestjs/common';
import { ISendNotificationOption } from '@/shared/interfaces/send-notification-option.inteface';

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);

  sendPush(options: ISendNotificationOption) {
    // Placeholder implementation for push notifications
    // TODO: Integrate with actual push service (e.g., Firebase, OneSignal)
    this.logger.log(
      `Push notification placeholder: Sending to ${options.userId} - Title: ${options.title}, Body: ${options.body}`,
    );
  }
}
