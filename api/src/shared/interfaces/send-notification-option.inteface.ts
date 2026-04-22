import { NotificationChannel } from '@/generated/prisma/enums';

export interface ISendNotificationOption {
  userId: string;
  title: string;
  body: string;
  channel: NotificationChannel[];
  template?: string;
  templateData?: Record<string, unknown>;
  reportId?: string;
  alertZoneId?: string;
  email?: string;
}
