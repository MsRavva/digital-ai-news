const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ID публикаций, которые нужно обновить
const postIds = [
  'x82bl0Y271hb1AEohR1l',
  'ssjbETGokRDm3Vv1Suns0',
  'Mv3G6AO8HxddIm4FipoEK',
  'aNHuWy5RKjfjjpkjY9Yd',
  'VZE9eB2lXnQJKZo0y6HC',
  'pu6eEtxkwcsXanVqdNBP',
  'xJy97CjVwCfROBbYUj5r',
  '1z0Njhwz8to8tVfMpoG8',
  'Anzi4ZK62wz8vh0qf204',
  'JICUyzgidJFec21MGI3h'
];

// Функция для обновления роли автора в публикациях по ID
async function updatePostsByIds() {
  console.log('Начинаем обновление публикаций...');
  
  try {
    // Создаем пакетное обновление
    const batch = db.batch();
    
    // Обновляем каждую публикацию
    for (const postId of postIds) {
      const postRef = db.collection('posts').doc(postId);
      batch.update(postRef, {
        'author.role': 'student', // Меняем роль на "ученик"
        'category': 'Идеи для проектов' // Убедимся, что категория правильная
      });
      console.log(`Подготовлено обновление для публикации с ID: ${postId}`);
    }
    
    // Выполняем пакетное обновление
    await batch.commit();
    console.log('Все публикации успешно обновлены');
    
  } catch (error) {
    console.error('Ошибка при обновлении публикаций:', error);
  }
}

// Запуск обновления
updatePostsByIds()
  .then(() => {
    console.log('Скрипт завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
