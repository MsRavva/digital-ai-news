import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Проверяем наличие переменных окружения
    if (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY) {
      // Используем переменные окружения
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized with environment variables');
    } else {
      // Используем файл с учетными данными
      try {
        // Динамический импорт для работы в Next.js
        const serviceAccount = require('../firebase-credentials.json');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialized with service account file');
      } catch (fileError) {
        console.error('Error loading service account file:', fileError);
        throw new Error('Firebase credentials not available');
      }
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
