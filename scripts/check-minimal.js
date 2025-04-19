// Минимальный скрипт для проверки публикации
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkPost() {
  try {
    const postId = 'ahcqo4NHXvD4RTQk6l0O';
    console.log(`Проверка публикации ${postId}`);
    
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (postDoc.exists) {
      const data = postDoc.data();
      console.log(`Категория: ${data.category}`);
      console.log(`Архивирована: ${data.archived ? 'Да' : 'Нет'}`);
    } else {
      console.log('Публикация не найдена');
    }
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkPost().then(() => process.exit());
