const admin = require('firebase-admin');
let serviceAccount;

// Пытаемся получить учетные данные из переменной окружения или из файла
try {
  // Сначала проверяем, есть ли переменная окружения
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('Используем учетные данные из переменной окружения FIREBASE_SERVICE_ACCOUNT_KEY');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Если переменной нет, пытаемся загрузить файл
    console.log('Пытаемся загрузить учетные данные из файла serviceAccountKey.json');
    serviceAccount = require('../serviceAccountKey.json');
  }

  // Инициализируем Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Ошибка при инициализации Firebase Admin SDK:');
  console.error(error.message);
  console.error('Убедитесь, что файл serviceAccountKey.json существует или переменная окружения FIREBASE_SERVICE_ACCOUNT_KEY установлена.');
  process.exit(1);
}

const db = admin.firestore();
const targetPostId = 'ahcqo4NHXvD4RTQk6l0O';

// Имитация функции getPaginatedPosts из firebase-db-extended.ts
async function getPaginatedPosts(options = {}) {
  try {
    const {
      limit = 10,
      startAfter = null,
      category = null,
      authorId = null,
      tag = null,
      includeArchived = false
    } = options;

    console.log('Параметры запроса:');
    console.log('- limit:', limit);
    console.log('- startAfter:', startAfter);
    console.log('- category:', category);
    console.log('- authorId:', authorId);
    console.log('- tag:', tag);
    console.log('- includeArchived:', includeArchived);

    // Шаг 1: Создаем базовый запрос
    let postsQuery = db.collection('posts');

    // Добавляем фильтры
    if (category && category !== 'all') {
      postsQuery = postsQuery.where('category', '==', category);
    }

    if (authorId) {
      postsQuery = postsQuery.where('author_id', '==', authorId);
    }

    if (!includeArchived) {
      postsQuery = postsQuery.where('archived', 'in', [false, null]);
    }

    // Добавляем сортировку
    postsQuery = postsQuery.orderBy('created_at', 'desc');

    // Если указан startAfter, добавляем курсор для пагинации
    if (startAfter) {
      const startAfterDoc = await db.collection('posts').doc(startAfter).get();
      if (startAfterDoc.exists) {
        postsQuery = postsQuery.startAfter(startAfterDoc);
      }
    }

    // Добавляем ограничение по количеству результатов
    postsQuery = postsQuery.limit(limit);

    // Выполняем запрос
    const snapshot = await postsQuery.get();

    console.log(`\nПолучено ${snapshot.size} публикаций`);

    if (snapshot.empty) {
      console.log('Публикации не найдены');
      return { posts: [], lastVisible: null };
    }

    // Преобразуем результаты в массив
    const posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title,
        category: data.category,
        archived: data.archived || false,
        created_at: data.created_at ? data.created_at.toDate() : null
      });
    });

    // Проверяем, есть ли целевой пост в результатах
    const targetPost = posts.find(post => post.id === targetPostId);
    if (targetPost) {
      console.log(`\nЦелевой пост с ID ${targetPostId} НАЙДЕН в результатах:`);
      console.log(targetPost);
    } else {
      console.log(`\nЦелевой пост с ID ${targetPostId} НЕ НАЙДЕН в результатах`);
    }

    // Возвращаем результаты и ID последнего документа для пагинации
    const lastVisible = posts.length > 0 ? posts[posts.length - 1].id : null;

    return { posts, lastVisible };
  } catch (error) {
    console.error('Ошибка при получении публикаций с пагинацией:', error);
    return { posts: [], lastVisible: null };
  }
}

// Тестируем различные сценарии
async function runTests() {
  console.log('=== Тест 1: Получение всех публикаций ===');
  await getPaginatedPosts();

  console.log('\n=== Тест 2: Получение публикаций с includeArchived=true ===');
  await getPaginatedPosts({ includeArchived: true });

  console.log('\n=== Тест 3: Получение публикаций категории "news" ===');
  await getPaginatedPosts({ category: 'news' });

  console.log('\n=== Тест 4: Получение публикаций категории "news" с includeArchived=true ===');
  await getPaginatedPosts({ category: 'news', includeArchived: true });

  // Получаем информацию о целевом посте
  console.log('\n=== Информация о целевом посте ===');
  const targetPostDoc = await db.collection('posts').doc(targetPostId).get();

  if (targetPostDoc.exists) {
    const targetPostData = targetPostDoc.data();
    console.log('ID:', targetPostId);
    console.log('Заголовок:', targetPostData.title);
    console.log('Категория:', targetPostData.category);
    console.log('Архивирован:', targetPostData.archived || false);
    console.log('Дата создания:', targetPostData.created_at ? targetPostData.created_at.toDate() : null);

    // Тестируем получение публикаций с параметрами, соответствующими целевому посту
    console.log('\n=== Тест 5: Получение публикаций с параметрами целевого поста ===');
    await getPaginatedPosts({
      category: targetPostData.category,
      includeArchived: true
    });
  } else {
    console.log(`Пост с ID ${targetPostId} не найден`);
  }
}

runTests().then(() => {
  console.log('\nТестирование завершено');
  process.exit(0);
}).catch(err => {
  console.error('Ошибка при тестировании:', err);
  process.exit(1);
});
