const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Функция для исправления структуры публикаций
async function fixPostStructure() {
  console.log('Начинаем исправление структуры публикаций...');
  
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
    
    // Создаем профиль Василия Смирнова, если его еще нет
    const vasilyId = 'vasily-smirnov';
    const vasilyProfileRef = db.collection('profiles').doc(vasilyId);
    const vasilyProfileDoc = await vasilyProfileRef.get();
    
    if (!vasilyProfileDoc.exists) {
      console.log('Создаем профиль Василия Смирнова...');
      await vasilyProfileRef.set({
        username: 'Василий Смирнов',
        role: 'student',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Профиль Василия Смирнова создан');
    }
    
    // Обновляем каждую публикацию
    const batch = db.batch();
    let updatedCount = 0;
    
    for (const doc of snapshot.docs) {
      const postData = doc.data();
      const postRef = db.collection('posts').doc(doc.id);
      
      // Проверяем структуру публикации
      let needsUpdate = false;
      const updates = {};
      
      // Проверяем наличие поля author_id
      if (!postData.author_id) {
        updates.author_id = vasilyId;
        needsUpdate = true;
      }
      
      // Проверяем наличие поля created_at
      if (!postData.created_at) {
        updates.created_at = admin.firestore.FieldValue.serverTimestamp();
        needsUpdate = true;
      }
      
      // Проверяем наличие поля updated_at
      if (!postData.updated_at) {
        updates.updated_at = admin.firestore.FieldValue.serverTimestamp();
        needsUpdate = true;
      }
      
      // Если есть поле author, но нет author_id, удаляем author и добавляем author_id
      if (postData.author && !postData.author_id) {
        updates.author_id = vasilyId;
        // Удаляем поле author, так как оно должно формироваться динамически
        updates.author = admin.firestore.FieldValue.delete();
        needsUpdate = true;
      }
      
      // Проверяем наличие полей likesCount, commentsCount, viewsCount
      if (postData.likesCount === undefined) {
        updates.likesCount = 0;
        needsUpdate = true;
      }
      
      if (postData.commentsCount === undefined) {
        updates.commentsCount = 0;
        needsUpdate = true;
      }
      
      if (postData.viewsCount === undefined) {
        updates.viewsCount = 0;
        needsUpdate = true;
      }
      
      // Если нужно обновить публикацию
      if (needsUpdate) {
        batch.update(postRef, updates);
        updatedCount++;
        console.log(`Подготовлено обновление для публикации: ${postData.title} (ID: ${doc.id})`);
      }
    }
    
    // Выполняем пакетное обновление, если есть что обновлять
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Обновлено ${updatedCount} публикаций`);
    } else {
      console.log('Все публикации имеют правильную структуру');
    }
    
  } catch (error) {
    console.error('Ошибка при исправлении структуры публикаций:', error);
  }
}

// Запуск исправления
fixPostStructure()
  .then(() => {
    console.log('Скрипт завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
