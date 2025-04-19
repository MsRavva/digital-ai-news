const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const postId = 'ahcqo4NHXvD4RTQk6l0O';

// Простая функция для исправления публикации
async function simpleFixPost() {
  try {
    console.log(`Исправляем публикацию с ID: ${postId}`);
    
    // Обновляем публикацию, устанавливая все необходимые поля
    await db.collection('posts').doc(postId).update({
      archived: false,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });
    
    console.log('Публикация обновлена');
    
    // Проверяем, что публикация обновлена
    const updatedDoc = await db.collection('posts').doc(postId).get();
    const updatedData = updatedDoc.data();
    
    console.log('\nОбновленные данные:');
    console.log('- Заголовок:', updatedData.title);
    console.log('- Архивирована:', updatedData.archived);
    console.log('- Дата создания:', updatedData.created_at.toDate());
    
    console.log('\nПубликация должна теперь отображаться корректно');
  } catch (error) {
    console.error('Ошибка при исправлении публикации:', error);
  }
}

simpleFixPost().then(() => {
  console.log('Операция завершена');
  process.exit(0);
}).catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
