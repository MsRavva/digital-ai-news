const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const postId = 'ahcqo4NHXvD4RTQk6l0O';

async function fixPostDisplay() {
  try {
    // Получаем документ публикации
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      console.log(`Публикация с ID ${postId} не найдена`);
      return;
    }
    
    const postData = postDoc.data();
    console.log('Текущие данные публикации:');
    console.log('- Заголовок:', postData.title);
    console.log('- Категория:', postData.category);
    console.log('- Архивирована:', postData.archived || false);
    console.log('- Дата создания:', postData.created_at ? postData.created_at.toDate() : null);
    
    // Создаем копию публикации с новым ID
    const newPostRef = db.collection('posts').doc();
    
    // Подготавливаем данные для новой публикации
    const newPostData = {
      ...postData,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      archived: false
    };
    
    // Удаляем поля, которые могут вызывать проблемы
    delete newPostData.viewsCount;
    delete newPostData.likesCount;
    delete newPostData.commentsCount;
    
    // Создаем новую публикацию
    await newPostRef.set(newPostData);
    
    console.log(`\nСоздана новая публикация с ID: ${newPostRef.id}`);
    
    // Получаем данные новой публикации
    const newPostDoc = await newPostRef.get();
    const newPostData = newPostDoc.data();
    
    console.log('\nДанные новой публикации:');
    console.log('- Заголовок:', newPostData.title);
    console.log('- Категория:', newPostData.category);
    console.log('- Архивирована:', newPostData.archived || false);
    console.log('- Дата создания:', newPostData.created_at ? newPostData.created_at.toDate() : null);
    
    // Архивируем старую публикацию
    await db.collection('posts').doc(postId).update({
      archived: true,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`\nСтарая публикация с ID ${postId} архивирована`);
    
    // Копируем теги
    const postTagsQuery = await db.collection('post_tags')
      .where('post_id', '==', postId)
      .get();
    
    if (!postTagsQuery.empty) {
      const batch = db.batch();
      
      postTagsQuery.forEach(doc => {
        const tagData = doc.data();
        const newTagRef = db.collection('post_tags').doc();
        
        batch.set(newTagRef, {
          post_id: newPostRef.id,
          tag_id: tagData.tag_id
        });
      });
      
      await batch.commit();
      console.log('\nТеги скопированы в новую публикацию');
    } else {
      console.log('\nУ публикации нет тегов');
    }
    
    console.log('\nПроцесс исправления завершен');
    console.log('Новая публикация должна отображаться корректно');
    console.log('Старая публикация архивирована и не будет отображаться в основном списке');
  } catch (error) {
    console.error('Ошибка при исправлении отображения публикации:', error);
  }
}

fixPostDisplay().then(() => {
  console.log('\nОперация завершена');
  process.exit(0);
}).catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
