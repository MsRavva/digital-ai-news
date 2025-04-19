const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Функция для публикации идеи проекта из файла
async function publishProjectIdea(filePath) {
  try {
    console.log(`Публикация идеи проекта из файла: ${filePath}`);
    
    // Чтение содержимого файла
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Парсинг frontmatter и содержимого
    const { data, content } = matter(fileContent);
    
    // Извлечение заголовка, описания и тегов
    const title = data.title || extractTitle(content);
    const description = data.description || extractDescription(content);
    
    // Извлечение тегов из содержимого
    const tags = extractTags(content);
    
    console.log(`Заголовок: ${title}`);
    console.log(`Теги: ${tags.join(', ')}`);
    
    // Создание документа публикации
    const postData = {
      title: title,
      content: content,
      description: description,
      author_id: "4J9Vf4tqKOU7vDcz99h6nBu0gHx2", // ID Василия Смирнова
      category: "project-ideas",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 0,
      viewsCount: 0,
      commentsCount: 0,
      archived: false,
      tags: tags
    };
    
    // Добавление документа в коллекцию posts
    const docRef = await db.collection('posts').add(postData);
    console.log(`Опубликована идея проекта: ${title} (ID: ${docRef.id})`);
    
    return docRef.id;
  } catch (error) {
    console.error(`Ошибка при публикации идеи проекта из файла ${filePath}:`, error);
    return null;
  }
}

// Функция для извлечения заголовка из содержимого
function extractTitle(content) {
  const titleMatch = content.match(/## \d+\.\s*(.*)/);
  return titleMatch ? titleMatch[1].trim() : 'Идея проекта';
}

// Функция для извлечения описания из содержимого
function extractDescription(content) {
  const descriptionMatch = content.match(/\*\*Описание\*\*:\s*(.*?)(?=\n\n)/s);
  return descriptionMatch ? descriptionMatch[1].trim() : '';
}

// Функция для извлечения тегов из содержимого
function extractTags(content) {
  const tagsMatch = content.match(/\*\*Теги\*\*:\s*(.*?)(?=\n\n|\n$|$)/s);
  if (!tagsMatch) return [];
  
  return tagsMatch[1].trim()
    .split('#')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

// Функция для публикации одной идеи
async function publishOneIdea() {
  const publicationsDir = path.join(__dirname, '../publications');
  const filePath = path.join(publicationsDir, 'project-ideas-19.04.25.md');
  
  // Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    console.error(`Файл ${filePath} не существует`);
    return;
  }
  
  // Чтение содержимого файла
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Разделение на отдельные идеи
  const ideas = fileContent.split(/## \d+\./g).filter(idea => idea.trim().length > 0);
  
  if (ideas.length === 0) {
    console.error('Не найдено идей в файле');
    return;
  }
  
  // Выбираем первую идею
  const firstIdea = '## 1.' + ideas[0];
  
  // Создаем временный файл для первой идеи
  const tempFilePath = path.join(__dirname, '../temp-idea.md');
  fs.writeFileSync(tempFilePath, firstIdea, 'utf8');
  
  console.log('Публикуем первую идею...');
  
  // Публикуем идею
  const postId = await publishProjectIdea(tempFilePath);
  
  if (postId) {
    console.log(`Идея успешно опубликована с ID: ${postId}`);
  } else {
    console.error('Не удалось опубликовать идею');
  }
  
  // Удаляем временный файл
  fs.unlinkSync(tempFilePath);
}

// Запуск публикации
publishOneIdea()
  .then(() => {
    console.log('Скрипт завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
