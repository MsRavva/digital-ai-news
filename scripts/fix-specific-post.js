const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ID публикации, которую нужно исправить
const postId = 'TClmP1aBnhBPKG6BcvDR';

// Функция для исправления конкретной публикации
async function fixSpecificPost() {
  console.log(`Исправляем публикацию с ID: ${postId}`);
  
  try {
    // Получаем публикацию
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      console.log(`Публикация с ID ${postId} не найдена`);
      return;
    }
    
    const postData = postDoc.data();
    console.log('Текущие данные публикации:', postData);
    
    // Обновляем публикацию
    await db.collection('posts').doc(postId).update({
      author_id: 'vasily-smirnov', // Исправляем ID автора
      author: admin.firestore.FieldValue.delete() // Удаляем поле author
    });
    
    console.log('Публикация успешно обновлена');
    
  } catch (error) {
    console.error('Ошибка при исправлении публикации:', error);
  }
}

// Запуск исправления
fixSpecificPost()
  .then(() => {
    console.log('Скрипт завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
