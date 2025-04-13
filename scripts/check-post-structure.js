const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Функция для проверки структуры публикаций
async function checkPostStructure() {
  console.log('Проверяем структуру публикаций...');
  
  try {
    // Получаем все публикации в категории "project-ideas"
    const snapshot = await db.collection('posts')
      .where('category', '==', 'project-ideas')
      .get();
    
    if (snapshot.empty) {
      console.log('Публикации в категории "project-ideas" не найдены');
      return;
    }
    
    console.log(`Найдено ${snapshot.size} публикаций в категории "project-ideas"`);
    
    // Проверяем структуру каждой публикации
    for (const doc of snapshot.docs) {
      const postData = doc.data();
      console.log(`\nПубликация: ${postData.title} (ID: ${doc.id})`);
      console.log('Структура:');
      console.log(`- author_id: ${postData.author_id || 'отсутствует'}`);
      console.log(`- created_at: ${postData.created_at ? 'присутствует' : 'отсутствует'}`);
      console.log(`- updated_at: ${postData.updated_at ? 'присутствует' : 'отсутствует'}`);
      console.log(`- likesCount: ${postData.likesCount !== undefined ? postData.likesCount : 'отсутствует'}`);
      console.log(`- commentsCount: ${postData.commentsCount !== undefined ? postData.commentsCount : 'отсутствует'}`);
      console.log(`- viewsCount: ${postData.viewsCount !== undefined ? postData.viewsCount : 'отсутствует'}`);
      
      // Проверяем наличие поля author
      if (postData.author) {
        console.log('- author: присутствует (должно быть удалено)');
      } else {
        console.log('- author: отсутствует (правильно)');
      }
      
      // Проверяем профиль автора
      if (postData.author_id) {
        const authorDoc = await db.collection('profiles').doc(postData.author_id).get();
        if (authorDoc.exists) {
          const authorData = authorDoc.data();
          console.log(`- Профиль автора: ${authorData.username} (${authorData.role})`);
        } else {
          console.log('- Профиль автора: не найден');
        }
      }
    }
    
  } catch (error) {
    console.error('Ошибка при проверке структуры публикаций:', error);
  }
}

// Запуск проверки
checkPostStructure()
  .then(() => {
    console.log('\nСкрипт завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
