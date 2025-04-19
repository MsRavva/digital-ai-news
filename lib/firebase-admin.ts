import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Создаем функцию для инициализации Firebase Admin SDK
function initializeFirebaseAdmin() {
  // Проверяем, что Firebase Admin SDK еще не инициализирован
  if (admin.apps.length === 0) {
    try {
      // Проверяем наличие переменной окружения FIREBASE_SERVICE_ACCOUNT_KEY
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          // Парсим JSON из переменной окружения
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
          });
          console.log('Firebase Admin initialized with service account from environment variable');
        } catch (jsonError) {
          console.error('Error parsing service account JSON from environment variable:', jsonError);
          throw new Error('Invalid Firebase service account JSON in environment variable');
        }
      } else {
        try {
          // Динамический импорт для работы в Next.js
          const serviceAccount = require('../serviceAccountKey.json');
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
          });
          console.log('Firebase Admin initialized with service account file');
        } catch (fileError) {
          console.error('Error loading service account file:', fileError);

          // Если не удалось загрузить файл, пробуем использовать отдельные переменные окружения
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
              databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
            });
            console.log('Firebase Admin initialized with individual environment variables');
          } else {
            throw new Error('Firebase credentials not available');
          }
        }
      }
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      // Возвращаем ошибку, чтобы она была видна в логах
      throw new Error(`Firebase Admin initialization error: ${error.message}`);
    }
  }

  return admin;
}

// Инициализируем Firebase Admin SDK
const firebaseAdmin = initializeFirebaseAdmin();

// Экспортируем Firebase Admin SDK и его сервисы
export default firebaseAdmin;
export const db = firebaseAdmin.firestore();
export const auth = firebaseAdmin.auth();
export const storage = firebaseAdmin.storage();
