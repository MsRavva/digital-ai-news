// Скрипт для публикации идеи проекта
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Инициализируем Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Получаем ссылку на Firestore
const db = admin.firestore();

// Функция для публикации идеи проекта
async function publishProjectIdea(filePath) {
  try {
    console.log(`Публикация идеи проекта из файла: ${filePath}`);
    
    // Чтение содержимого файла
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Извлечение заголовка (первая строка, начинающаяся с #)
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Без заголовка';
    
    // Извлечение описания (первый абзац после введения)
    const descriptionMatch = content.match(/## Описание проекта\s+([^#]+)/);
    const description = descriptionMatch 
      ? descriptionMatch[1].trim().split('\n\n')[0] 
      : 'Без описания';
    
    // Извлечение тегов
    const tagsMatch = content.match(/\*\*Теги\*\*: (.+)/);
    const tagsString = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsString
      .split(/[,\s#]+/)
      .filter(tag => tag.length > 0)
      .map(tag => tag.trim());
    
    // Создание документа публикации
    const postData = {
      title: title,
      content: content,
      description: description,
      author_id: "4J9Vf4tqKOU7vDcz99h6nBu0gHx2", // ID Василия Смирнова
      category: "project-ideas",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes: 0,
      views: 0,
      comments: 0,
      archived: false,
      pinned: false,
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

// Путь к файлу с идеей
const ideaFilePath = path.join(__dirname, '../publications/idea-1-22.04.25.md');

// Публикация идеи
publishProjectIdea(ideaFilePath)
  .then((postId) => {
    if (postId) {
      console.log(`Идея проекта успешно опубликована с ID: ${postId}`);
    } else {
      console.error('Не удалось опубликовать идею проекта');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка при выполнении скрипта:', error);
    process.exit(1);
  });
