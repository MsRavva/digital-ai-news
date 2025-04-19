const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Инициализация Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  try {
    serviceAccount = require('../firebase-credentials.json');
  } catch (e2) {
    console.error('Не удалось найти файл с учетными данными Firebase');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Получаем ID публикации из аргументов командной строки
const postId = process.argv[2];

if (!postId) {
  console.error('Необходимо указать ID публикации');
  console.log('Использование: node get-post-info.js <post_id>');
  process.exit(1);
}

// Функция для получения информации о публикации
async function getPostInfo(postId) {
  try {
    // Получаем документ публикации
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      console.error(`Публикация с ID ${postId} не найдена`);
      return;
    }
    
    const postData = postDoc.data();
    
    console.log(`Информация о публикации с ID ${postId}:`);
    console.log(`Заголовок: ${postData.title}`);
    console.log(`Категория: ${postData.category}`);
    console.log(`Автор ID: ${postData.author_id}`);
    console.log(`Содержание: ${postData.content.substring(0, 200)}...`);
    
    // Проверяем наличие тегов
    if (postData.tags && Array.isArray(postData.tags)) {
      console.log(`Теги: ${postData.tags.join(', ')}`);
    } else {
      console.log('Теги отсутствуют');
    }
  } catch (error) {
    console.error('Ошибка при получении информации о публикации:', error);
  }
}

// Запускаем получение информации
getPostInfo(postId)
  .then(() => {
    console.log('Получение информации завершено');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
