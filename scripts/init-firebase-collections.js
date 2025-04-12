/**
 * Скрипт для инициализации коллекций в Firebase
 * 
 * Для запуска:
 * 1. Убедитесь, что .env.local файл содержит конфигурацию Firebase
 * 2. Запустите: node scripts/init-firebase-collections.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Список необходимых коллекций
const collections = [
  'posts',
  'tags',
  'post_tags',
  'comments',
  'likes',
  'views'
];

// Создаем пустой документ в каждой коллекции для их инициализации
async function initializeCollections() {
  try {
    console.log('Начало инициализации коллекций в Firebase...');
    
    for (const collectionName of collections) {
      console.log(`Инициализация коллекции ${collectionName}...`);
      
      // Создаем временный документ
      const tempDocRef = doc(collection(db, collectionName), 'temp_init_doc');
      
      // Устанавливаем данные документа
      await setDoc(tempDocRef, {
        _init: true,
        created_at: new Date(),
        description: `Временный документ для инициализации коллекции ${collectionName}`
      });
      
      console.log(`Коллекция ${collectionName} успешно инициализирована`);
    }
    
    console.log('Все коллекции успешно инициализированы!');
  } catch (error) {
    console.error('Ошибка при инициализации коллекций:', error);
  }
}

// Запускаем инициализацию
initializeCollections();
