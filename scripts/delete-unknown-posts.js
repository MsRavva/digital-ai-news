const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Инициализация Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteUnknownAuthorPosts() {
  try {
    console.log('Поиск публикаций с автором Unknown...');
    
    // Получаем все публикации
    const postsSnapshot = await db.collection('posts').get();
    
    // Фильтруем публикации с автором Unknown
    const unknownPosts = [];
    
    for (const doc of postsSnapshot.docs) {
      const postData = doc.data();
      
      // Проверяем, что автор Unknown или отсутствует
      if (!postData.author_id || 
          (postData.author && postData.author.username === 'Unknown') ||
          (postData.author && !postData.author.username)) {
        unknownPosts.push({
          id: doc.id,
          title: postData.title || 'Без названия'
        });
      }
    }
    
    console.log(`Найдено ${unknownPosts.length} публикаций с автором Unknown:`);
    unknownPosts.forEach(post => {
      console.log(`- ${post.title} (ID: ${post.id})`);
    });
    
    if (unknownPosts.length === 0) {
      console.log('Публикаций с автором Unknown не найдено.');
      return;
    }
    
    console.log('\nУдаление публикаций...');
    
    // Удаляем каждую публикацию и связанные данные
    for (const post of unknownPosts) {
      await deletePost(post.id);
      console.log(`Удалена публикация: ${post.title} (ID: ${post.id})`);
    }
    
    console.log('\nВсе публикации с автором Unknown успешно удалены!');
  } catch (error) {
    console.error('Ошибка при удалении публикаций:', error);
  }
}

// Функция для каскадного удаления публикации и связанных данных
async function deletePost(postId) {
  const batch = admin.firestore().batch();
  
  // Удаляем пост
  const postRef = db.collection('posts').doc(postId);
  batch.delete(postRef);
  
  // Удаляем связи с тегами
  const postTagsSnapshot = await db.collection('post_tags')
    .where('post_id', '==', postId)
    .get();
  
  postTagsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Удаляем лайки поста
  const likesSnapshot = await db.collection('likes')
    .where('post_id', '==', postId)
    .get();
  
  likesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Удаляем просмотры поста
  const viewsSnapshot = await db.collection('views')
    .where('post_id', '==', postId)
    .get();
  
  viewsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Находим все комментарии к посту
  const commentsSnapshot = await db.collection('comments')
    .where('post_id', '==', postId)
    .get();
  
  // Получаем ID всех комментариев
  const commentIds = commentsSnapshot.docs.map(doc => doc.id);
  
  // Удаляем комментарии
  commentsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Удаляем лайки комментариев
  for (const commentId of commentIds) {
    const commentLikesSnapshot = await db.collection('comment_likes')
      .where('comment_id', '==', commentId)
      .get();
    
    commentLikesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  }
  
  // Выполняем транзакцию
  await batch.commit();
}

// Запускаем функцию удаления
deleteUnknownAuthorPosts()
  .then(() => {
    console.log('Скрипт завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
