import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isFirebaseInitialized = false;
let firebaseAdminModule: any = null;

const initFirebase = async () => {
  if (isFirebaseInitialized) return;

  try {
    const configDir = path.join(__dirname, '../config');
    if (!fs.existsSync(configDir)) return;

    const files = fs.readdirSync(configDir);
    const serviceAccountFile = files.find((f) => f.includes('firebase-adminsdk') || f.includes('firebase-service-account'));

    if (serviceAccountFile) {
      const keyPath = path.join(configDir, serviceAccountFile);
      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

      // Dynamic import to prevent build failure on Vercel
      // @ts-ignore
      const adminModule = await (import('firebase-admin') as any);
      firebaseAdminModule = adminModule.default || adminModule;

      if (firebaseAdminModule && !firebaseAdminModule.apps?.length) {
        firebaseAdminModule.initializeApp({
          credential: firebaseAdminModule.credential.cert(serviceAccount),
        });
      }
      isFirebaseInitialized = true;
      console.log(`[PushNotification] Firebase Admin SDK initialized with ${serviceAccountFile}`);
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
  if (!isFirebaseInitialized || !firebaseAdminModule) return false;

  try {
    await firebaseAdminModule.messaging().send({
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
