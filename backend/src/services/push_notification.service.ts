import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isFirebaseInitialized = false;

try {
  const configDir = path.join(__dirname, '../config');
  const files = fs.readdirSync(configDir);
  const serviceAccountFile = files.find((f) => f.includes('firebase-adminsdk') || f.includes('firebase-service-account'));

  if (serviceAccountFile) {
    const keyPath = path.join(configDir, serviceAccountFile);
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseInitialized = true;
    console.log(`[PushNotification] Firebase Admin SDK initialized with ${serviceAccountFile}`);
  } else {
    console.log('[PushNotification] No Firebase service account file found in backend/src/config. Push notifications disabled.');
  }
} catch (error: any) {
  console.error('[PushNotification] Failed to initialize Firebase Admin SDK:', error.message || error);
}

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> => {
  if (!isFirebaseInitialized || !fcmToken) {
    return false;
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data || {},
    });
    console.log(`[PushNotification] Sent push to token: ${fcmToken.substring(0, 15)}... Title: "${title}"`);
    return true;
  } catch (error: any) {
    console.error(`[PushNotification] Failed to send push: ${error.message || error}`);
    return false;
  }
};
