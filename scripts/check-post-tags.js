const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Функция для проверки тегов публикаций
async function checkPostTags() {
  console.log('Проверяем теги публикаций...');
  
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
    
    // Получаем все теги
    const tagsSnapshot = await db.collection('tags').get();
    const tagsMap = {};
    tagsSnapshot.forEach(doc => {
      tagsMap[doc.id] = doc.data().name;
    });
    
    // Проверяем теги каждой публикации
    for (const doc of snapshot.docs) {
      const postId = doc.id;
      const postData = doc.data();
      
      console.log(`\nПубликация: ${postData.title} (ID: ${postId})`);
      
      // Получаем теги публикации
      const postTagsSnapshot = await db.collection('post_tags')
        .where('post_id', '==', postId)
        .get();
      
      if (postTagsSnapshot.empty) {
        console.log('  Теги: отсутствуют');
      } else {
        console.log(`  Теги (${postTagsSnapshot.size}):`);
        postTagsSnapshot.forEach(tagDoc => {
          const tagId = tagDoc.data().tag_id;
          const tagName = tagsMap[tagId] || 'Неизвестный тег';
          console.log(`  - ${tagName} (ID: ${tagId})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Ошибка при проверке тегов публикаций:', error);
  }
}

// Запуск проверки
checkPostTags()
  .then(() => {
    console.log('\nСкрипт завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
