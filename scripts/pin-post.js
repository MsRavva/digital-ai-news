// Скрипт для закрепления публикации
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const path = require('path');

// Инициализируем Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Получаем ссылку на Firestore
const db = admin.firestore();

// ID публикации, которую нужно закрепить
const postId = 'BGlf9AvOWJaQLlXwZmiS'; // Замените на ID публикации, которую хотите закрепить

async function pinPost() {
  try {
    console.log(`Закрепляем публикацию с ID: ${postId}...`);
    
    // Получаем публикацию
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      console.log(`Публикация с ID ${postId} не найдена`);
      return;
    }
    
    // Устанавливаем поле pinned в true
    await db.collection('posts').doc(postId).update({
      pinned: true
    });
    
    console.log(`Публикация ${postId} успешно закреплена!`);
    
  } catch (error) {
    console.error('Ошибка при закреплении публикации:', error);
  }
}

// Запускаем функцию закрепления
pinPost().then(() => {
  console.log('Скрипт завершен');
  process.exit(0);
}).catch(error => {
  console.error('Ошибка выполнения скрипта:', error);
  process.exit(1);
});
