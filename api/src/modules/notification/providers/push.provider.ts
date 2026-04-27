import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as serviceAccount from './../../../../firebase/firebase-service-account.json';

@Injectable()
export class PushProvider implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      });
    }
  }

  async sendPushNotification(token: string, title: string, body: string) {
    const message: admin.messaging.Message = {
      token,
      notification: { title, body },
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: { sound: 'default' },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return response;
  }
}
