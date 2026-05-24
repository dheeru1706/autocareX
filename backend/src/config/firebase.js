'use strict';

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp = null;

function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
        };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    logger.info('Firebase Admin SDK initialized', { projectId: process.env.FIREBASE_PROJECT_ID });
  } catch (err) {
    // In development, Firebase init may fail due to placeholder credentials — that's fine
    logger.warn('Firebase initialization skipped (dev mode or missing credentials)', { error: err.message });
    firebaseApp = null;
  }

  return firebaseApp;
}

function getMessaging() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  if (!firebaseApp) return null; // dev mode: no firebase
  return admin.messaging();
}

module.exports = { initializeFirebase, getMessaging, admin };
