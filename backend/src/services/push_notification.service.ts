import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isFirebaseInitialized = false;

const initFirebase = async () => {
  if (isFirebaseInitialized) return;

  try {
    const candidateDirs = [
      path.join(process.cwd(), 'src/config'),
      path.join(process.cwd(), 'backend/src/config'),
      path.join(process.cwd(), 'dist/config'),
      path.join(__dirname, '../config'),
      path.join(__dirname, '../../src/config'),
    ];

    let serviceAccount: any = null;
    let foundFile = '';

    for (const dir of candidateDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const file = files.find((f) => f.includes('firebase-adminsdk') || f.includes('firebase-service-account'));
        if (file) {
          const keyPath = path.join(dir, file);
          serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
          foundFile = file;
          break;
        }
      }
    }

    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        foundFile = 'FIREBASE_SERVICE_ACCOUNT env';
      } catch (e) {}
    }

    if (serviceAccount) {
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount),
        });
      }
      isFirebaseInitialized = true;
      console.log(`[PushNotification] Firebase Admin SDK initialized with ${foundFile}`);
    } else {
      console.warn('[PushNotification] No Firebase service account file found in candidate paths.');
    }
  } catch (error: any) {
    console.error('[PushNotification] Failed to initialize Firebase Admin SDK:', error.message || error);
  }
};

initFirebase().catch(() => {});

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  if (!fcmToken) return false;
  await initFirebase();
  if (!isFirebaseInitialized) return false;

  try {
    await getMessaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default_notification_channel',
          sound: 'default',
          defaultSound: true,
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            contentAvailable: true,
          },
        },
        headers: {
          'apns-priority': '10',
        },
      },
    });
    console.log(`[PushNotification] Sent push to token: ${fcmToken.substring(0, 15)}... Title: "${title}"`);
    return true;
  } catch (error: any) {
    console.error(`[PushNotification] Failed to send push: ${error.message || error}`);
    return false;
  }
};
