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
      logger.warn('Firebase configuration is incomplete. Push notifications will not work.');
      return null;
    }

    // Decode base64 private key if needed
    const privateKey = config.FIREBASE_PRIVATE_KEY.includes('\\n')
      ? config.FIREBASE_PRIVATE_KEY
      : Buffer.from(config.FIREBASE_PRIVATE_KEY, 'base64').toString('utf-8');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
      }),
    });

    logger.info('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
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
    return null;
  }
  return admin.messaging(app);
};
