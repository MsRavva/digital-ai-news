const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Функция для проверки и исправления целостности публикаций
async function checkPostsIntegrity() {
  try {
    console.log('Проверка целостности публикаций...');
    
    // Получаем все публикации
    const postsSnapshot = await db.collection('posts').get();
    
    if (postsSnapshot.empty) {
      console.log('Публикации не найдены');
      return;
    }
    
    console.log(`Найдено ${postsSnapshot.size} публикаций`);
    
    // Счетчики для статистики
    let fixedCount = 0;
    let alreadyOkCount = 0;
    
    // Проверяем каждую публикацию
    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;
      const postData = postDoc.data();
      
      // Проверяем наличие проблем
      const issues = [];
      
      // Проверка обязательных полей
      const requiredFields = [
        { name: 'title', defaultValue: '' },
        { name: 'content', defaultValue: '' },
        { name: 'category', defaultValue: 'news' },
        { name: 'author_id', defaultValue: null },
        { name: 'created_at', defaultValue: admin.firestore.Timestamp.now() },
        { name: 'updated_at', defaultValue: admin.firestore.Timestamp.now() },
        { name: 'archived', defaultValue: false },
        { name: 'likesCount', defaultValue: 0 },
        { name: 'commentsCount', defaultValue: 0 },
        { name: 'viewsCount', defaultValue: 0 }
      ];
      
      const updateData = {};
      let needsUpdate = false;
      
      for (const field of requiredFields) {
        if (postData[field.name] === undefined || postData[field.name] === null) {
          issues.push(`Отсутствует поле ${field.name}`);
          updateData[field.name] = field.defaultValue;
          needsUpdate = true;
        }
      }
      
      // Проверка даты создания в будущем
      if (postData.created_at && postData.created_at.toDate && postData.created_at.toDate() > new Date()) {
        issues.push('Дата создания в будущем');
        updateData.created_at = admin.firestore.Timestamp.now();
        needsUpdate = true;
      }
      
      // Проверка даты обновления в будущем
      if (postData.updated_at && postData.updated_at.toDate && postData.updated_at.toDate() > new Date()) {
        issues.push('Дата обновления в будущем');
        updateData.updated_at = admin.firestore.Timestamp.now();
        needsUpdate = true;
      }
      
      // Если есть проблемы, исправляем
      if (needsUpdate) {
        console.log(`\nИсправляем публикацию: "${postData.title || 'Без заголовка'}" (ID: ${postId})`);
        issues.forEach(issue => console.log(`- ${issue}`));
        
        // Обновляем публикацию
        await db.collection('posts').doc(postId).update(updateData);
        
        console.log('Публикация исправлена');
        fixedCount++;
      } else {
        alreadyOkCount++;
      }
    }
    
    // Выводим статистику
    console.log('\n=== Статистика ===');
    console.log(`Всего публикаций: ${postsSnapshot.size}`);
    console.log(`Исправлено публикаций: ${fixedCount}`);
    console.log(`Публикаций без проблем: ${alreadyOkCount}`);
    
  } catch (error) {
    console.error('Ошибка при проверке целостности публикаций:', error);
  }
}

// Запускаем проверку
checkPostsIntegrity().then(() => {
  console.log('\nПроверка завершена');
  process.exit(0);
}).catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
