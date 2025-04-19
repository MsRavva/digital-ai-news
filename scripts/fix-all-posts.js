const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Функция для проверки и исправления всех публикаций
async function fixAllPosts() {
  try {
    console.log('Начинаем проверку и исправление всех публикаций...');
    
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
    const fixedPosts = [];
    const problemPosts = [];
    
    // Проверяем каждую публикацию
    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;
      const postData = postDoc.data();
      
      // Проверяем наличие проблем
      const hasArchivedIssue = postData.archived === undefined || postData.archived === null;
      const hasDateIssue = !postData.created_at || 
                          (postData.created_at.toDate && postData.created_at.toDate() > new Date()) ||
                          (postData.created_at._seconds && postData.created_at._seconds > Math.floor(Date.now() / 1000));
      const hasUpdateDateIssue = !postData.updated_at;
      
      // Если есть проблемы, исправляем
      if (hasArchivedIssue || hasDateIssue || hasUpdateDateIssue) {
        console.log(`\nИсправляем публикацию: "${postData.title}" (ID: ${postId})`);
        
        if (hasArchivedIssue) console.log('- Проблема с полем archived');
        if (hasDateIssue) console.log('- Проблема с датой создания');
        if (hasUpdateDateIssue) console.log('- Проблема с датой обновления');
        
        // Подготавливаем данные для обновления
        const updateData = {};
        
        if (hasArchivedIssue) {
          updateData.archived = false;
        }
        
        if (hasDateIssue) {
          updateData.created_at = admin.firestore.Timestamp.now();
        }
        
        if (hasUpdateDateIssue) {
          updateData.updated_at = admin.firestore.Timestamp.now();
        }
        
        // Обновляем публикацию
        await db.collection('posts').doc(postId).update(updateData);
        
        console.log('Публикация исправлена');
        fixedCount++;
        fixedPosts.push({
          id: postId,
          title: postData.title,
          issues: {
            archived: hasArchivedIssue,
            created_at: hasDateIssue,
            updated_at: hasUpdateDateIssue
          }
        });
      } else {
        alreadyOkCount++;
      }
      
      // Проверяем другие потенциальные проблемы (не исправляем, только логируем)
      const missingFields = [];
      ['title', 'content', 'category', 'author_id'].forEach(field => {
        if (postData[field] === undefined || postData[field] === null) {
          missingFields.push(field);
        }
      });
      
      if (missingFields.length > 0) {
        console.log(`\nПубликация "${postData.title}" (ID: ${postId}) имеет отсутствующие поля: ${missingFields.join(', ')}`);
        problemPosts.push({
          id: postId,
          title: postData.title,
          missingFields
        });
      }
    }
    
    // Выводим статистику
    console.log('\n=== Статистика ===');
    console.log(`Всего публикаций: ${postsSnapshot.size}`);
    console.log(`Исправлено публикаций: ${fixedCount}`);
    console.log(`Публикаций без проблем: ${alreadyOkCount}`);
    console.log(`Публикаций с другими проблемами: ${problemPosts.length}`);
    
    // Выводим список исправленных публикаций
    if (fixedPosts.length > 0) {
      console.log('\n=== Исправленные публикации ===');
      fixedPosts.forEach((post, index) => {
        console.log(`${index + 1}. "${post.title}" (ID: ${post.id})`);
        if (post.issues.archived) console.log('   - Исправлено поле archived');
        if (post.issues.created_at) console.log('   - Исправлена дата создания');
        if (post.issues.updated_at) console.log('   - Исправлена дата обновления');
      });
    }
    
    // Выводим список публикаций с другими проблемами
    if (problemPosts.length > 0) {
      console.log('\n=== Публикации с другими проблемами ===');
      problemPosts.forEach((post, index) => {
        console.log(`${index + 1}. "${post.title}" (ID: ${post.id})`);
        console.log(`   - Отсутствующие поля: ${post.missingFields.join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('Ошибка при исправлении публикаций:', error);
  }
}

fixAllPosts().then(() => {
  console.log('\nОперация завершена');
  process.exit(0);
}).catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
