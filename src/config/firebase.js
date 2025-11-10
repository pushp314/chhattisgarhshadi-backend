import admin from 'firebase-admin';
import { config } from './config.js';
import { logger } from './logger.js';

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * @returns {admin.app.App} Firebase Admin App instance
 */
export const initializeFirebase = () => {
  try {
    if (firebaseApp) {
      return firebaseApp;
    }

    // Check if all required Firebase config is available
    if (!config.FIREBASE_PROJECT_ID || !config.FIREBASE_PRIVATE_KEY || !config.FIREBASE_CLIENT_EMAIL) {
      logger.warn('⚠️  Firebase configuration is incomplete. Push notifications will not work.');
      return null;
    }

    // Replace escaped newlines in private key
    const privateKey = config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
      }),
    });

    logger.info('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin SDK:', error.message, {
      errorInfo: error.errorInfo,
      codePrefix: error.codePrefix,
    });
    return null;
  }
};

/**
 * Get Firebase Admin App instance
 * @returns {admin.app.App|null}
 */
export const getFirebaseApp = () => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};

/**
 * Get Firebase Messaging instance
 * @returns {admin.messaging.Messaging|null}
 */
export const getMessaging = () => {
  const app = getFirebaseApp();
  if (!app) {
    logger.warn('⚠️  Firebase not initialized - cannot get messaging instance');
    return null;
  }
  try {
    return admin.messaging(app);
  } catch (error) {
    logger.error('❌ Error getting Firebase messaging:', error.message);
    return null;
  }
};

/**
 * Send push notification
 * @param {string} token - FCM device token
 * @param {Object} notification - Notification payload
 * @returns {Promise<string|null>}
 */
export const sendPushNotification = async (token, notification) => {
  try {
    const messaging = getMessaging();
    
    if (!messaging) {
      logger.warn('⚠️  Push notification skipped - Firebase not initialized');
      return null;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      token: token,
    };

    const response = await messaging.send(message);
    logger.info('✅ Push notification sent successfully:', response);
    return response;
  } catch (error) {
    logger.error('❌ Failed to send push notification:', error.message);
    throw error;
  }
};

export default {
  initializeFirebase,
  getFirebaseApp,
  getMessaging,
  sendPushNotification,
};