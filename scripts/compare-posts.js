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

// Функция для получения всех публикаций из базы данных
async function getAllPosts(includeArchived = false) {
  try {
    let postsQuery = db.collection('posts');

    if (!includeArchived) {
      postsQuery = postsQuery.where('archived', 'in', [false, null]);
    }

    postsQuery = postsQuery.orderBy('created_at', 'desc');

    const snapshot = await postsQuery.get();

    console.log(`Получено ${snapshot.size} публикаций из базы данных`);

    const posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title,
        category: data.category,
        author_id: data.author_id,
        created_at: data.created_at ? data.created_at.toDate() : null,
        archived: data.archived || false,
        content: data.content ? data.content.substring(0, 50) + '...' : null
      });
    });

    return posts;
  } catch (error) {
    console.error('Ошибка при получении публикаций:', error);
    return [];
  }
}

// Функция для проверки, есть ли проблемы с публикацией
async function checkPostIssues(post) {
  const issues = [];

  // Проверка на null или undefined значения в обязательных полях
  const requiredFields = ['title', 'content', 'category', 'author_id', 'created_at'];
  for (const field of requiredFields) {
    if (post[field] === undefined || post[field] === null) {
      issues.push(`Отсутствует обязательное поле: ${field}`);
    }
  }

  // Проверка автора
  if (post.author_id) {
    const authorDoc = await db.collection('profiles').doc(post.author_id).get();
    if (!authorDoc.exists) {
      issues.push(`Автор с ID ${post.author_id} не найден`);
    }
  }

  // Проверка на необычные символы в заголовке или контенте
  if (post.title && /[^\w\s\p{L}\p{P}]/u.test(post.title)) {
    issues.push('Заголовок содержит необычные символы');
  }

  // Проверка на слишком длинный заголовок
  if (post.title && post.title.length > 200) {
    issues.push(`Слишком длинный заголовок: ${post.title.length} символов`);
  }

  // Проверка на слишком короткий контент
  if (post.content && post.content.length < 10) {
    issues.push('Слишком короткий контент');
  }

  // Проверка на дату в будущем
  if (post.created_at && post.created_at > new Date()) {
    issues.push(`Дата создания в будущем: ${post.created_at}`);
  }

  return issues;
}

// Основная функция для сравнения публикаций
async function comparePosts() {
  // Получаем все публикации
  const allPosts = await getAllPosts(false);

  // Сортируем по дате создания (от новых к старым)
  allPosts.sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return b.created_at - a.created_at;
  });

  // Выводим список всех публикаций
  console.log('\nСписок всех публикаций:');
  allPosts.forEach((post, index) => {
    console.log(`${index + 1}. ${post.title} (ID: ${post.id})`);
    console.log(`   Категория: ${post.category}, Дата: ${post.created_at}`);
  });

  // Проверяем, есть ли целевая публикация в списке
  const targetPost = allPosts.find(post => post.id === targetPostId);

  if (targetPost) {
    console.log('\nЦелевая публикация найдена в списке:');
    console.log('- ID:', targetPost.id);
    console.log('- Заголовок:', targetPost.title);
    console.log('- Категория:', targetPost.category);
    console.log('- Дата создания:', targetPost.created_at);
    console.log('- Архивирована:', targetPost.archived);

    // Проверяем, есть ли проблемы с публикацией
    const issues = await checkPostIssues(targetPost);

    if (issues.length > 0) {
      console.log('\nОбнаружены проблемы с публикацией:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('\nПроблем с публикацией не обнаружено');
    }
  } else {
    console.log('\nЦелевая публикация НЕ найдена в списке');
  }

  // Проверяем все публикации на наличие проблем
  console.log('\nПроверяем все публикации на наличие проблем:');

  for (const post of allPosts) {
    const issues = await checkPostIssues(post);

    if (issues.length > 0) {
      console.log(`\nПроблемы с публикацией "${post.title}" (ID: ${post.id}):`);
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
  }
}

comparePosts().then(() => {
  console.log('\nСравнение завершено');
  process.exit(0);
}).catch(err => {
  console.error('Ошибка при сравнении публикаций:', err);
  process.exit(1);
});
