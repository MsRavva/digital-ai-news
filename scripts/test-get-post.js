const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getPostById(postId) {
  try {
    // Получаем документ поста
    const postDoc = await db.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      console.log(`Пост с ID ${postId} не найден`);
      return null;
    }

    const postData = postDoc.data();
    console.log('Данные поста:');
    console.log(JSON.stringify(postData, null, 2));

    // Проверяем, архивирован ли пост
    console.log(`Архивирован: ${postData.archived ? 'Да' : 'Нет'}`);

    return postData;
  } catch (error) {
    console.error('Ошибка при получении поста:', error);
    return null;
  }
}

// Проверяем пост с указанным ID
const postId = process.argv[2] || 'ahcqo4NHXvD4RTQk6l0O';
getPostById(postId).then(() => {
  console.log('Проверка завершена');
  process.exit(0);
}).catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
