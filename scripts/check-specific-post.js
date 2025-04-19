const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  try {
    serviceAccount = require('../firebase-credentials.json');
  } catch (e2) {
    console.error('Не удалось найти файл с учетными данными Firebase');
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Функция для проверки структуры конкретной публикации
async function checkSpecificPost(postId) {
  console.log(`Проверяем публикацию с ID: ${postId}`);
  
  try {
    // Получаем публикацию
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      console.log(`Публикация с ID ${postId} не найдена`);
      return;
    }
    
    const postData = postDoc.data();
    console.log(`\nПубликация: ${postData.title}`);
    console.log('Полная структура:');
    console.log(JSON.stringify(postData, null, 2));
    
    // Проверяем ключевые поля
    console.log('\nКлючевые поля:');
    console.log(`- author_id: ${postData.author_id || 'отсутствует'}`);
    console.log(`- created_at: ${postData.created_at ? 'присутствует' : 'отсутствует'}`);
    console.log(`- updated_at: ${postData.updated_at ? 'присутствует' : 'отсутствует'}`);
    console.log(`- likesCount: ${postData.likesCount !== undefined ? postData.likesCount : 'отсутствует'}`);
    console.log(`- commentsCount: ${postData.commentsCount !== undefined ? postData.commentsCount : 'отсутствует'}`);
    console.log(`- viewsCount: ${postData.viewsCount !== undefined ? postData.viewsCount : 'отсутствует'}`);
    
    // Проверяем наличие поля author
    if (postData.author) {
      console.log('- author: присутствует');
      console.log(`  - username: ${postData.author.username || 'отсутствует'}`);
      console.log(`  - role: ${postData.author.role || 'отсутствует'}`);
    } else {
      console.log('- author: отсутствует');
    }
    
    // Проверяем профиль автора
    if (postData.author_id) {
      const authorDoc = await db.collection('profiles').doc(postData.author_id).get();
      console.log('\nПрофиль автора:');
      if (authorDoc.exists) {
        const authorData = authorDoc.data();
        console.log(JSON.stringify(authorData, null, 2));
      } else {
        console.log('Профиль автора не найден');
      }
    }
    
    // Проверяем текущего пользователя
    const currentUserId = process.argv[3];
    if (currentUserId) {
      console.log(`\nПроверяем текущего пользователя с ID: ${currentUserId}`);
      const userDoc = await db.collection('profiles').doc(currentUserId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('Профиль текущего пользователя:');
        console.log(JSON.stringify(userData, null, 2));
        
        // Проверяем права на удаление
        const canDelete = 
          postData.author_id === currentUserId || 
          userData.role === 'admin' || 
          userData.role === 'teacher';
        
        console.log(`\nПрава на удаление: ${canDelete ? 'Да' : 'Нет'}`);
        console.log(`- Автор публикации: ${postData.author_id === currentUserId ? 'Да' : 'Нет'}`);
        console.log(`- Роль пользователя: ${userData.role || 'не указана'}`);
      } else {
        console.log('Профиль текущего пользователя не найден');
      }
    }
    
  } catch (error) {
    console.error('Ошибка при проверке публикации:', error);
  }
}

// Получаем ID публикации из аргументов командной строки
const postId = process.argv[2];
if (!postId) {
  console.log('Пожалуйста, укажите ID публикации в качестве первого аргумента');
  process.exit(1);
}

// Запуск проверки
checkSpecificPost(postId)
  .then(() => {
    console.log('\nСкрипт завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
