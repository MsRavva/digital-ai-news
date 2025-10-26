const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")
// Удаляем неиспользуемый импорт uuid
// const { v4: uuidv4 } = require('uuid');

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Функция для чтения содержимого файла
function readMarkdownFile(filePath) {
  return fs.readFileSync(filePath, "utf8")
}

// Функция для публикации идеи проекта
async function publishProjectIdea(filePath, index) {
  try {
    const content = readMarkdownFile(filePath)

    // Извлечение заголовка (первая строка, начинающаяся с #)
    const titleMatch = content.match(/^# (.+)$/m)
    const title = titleMatch ? titleMatch[1] : `Идея проекта ${index}`

    // Извлечение первого абзаца после ## Введение как описание
    const descriptionMatch = content.match(/## Введение\s+(.+?)(?=\s*##|\s*$)/s)
    const description = descriptionMatch
      ? descriptionMatch[1].trim().substring(0, 200) + "..."
      : "Описание идеи проекта..."

    // Создание документа публикации
    const postData = {
      title: title,
      content: content,
      description: description,
      author: {
        uid: "vasily-smirnov", // ID пользователя Василий Смирнов
        displayName: "Василий Смирнов",
        role: "teacher",
      },
      category: "Идеи для проектов",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      likes: 0,
      views: 0,
    }

    // Добавление документа в коллекцию posts
    const docRef = await db.collection("posts").add(postData)
    console.log(`Опубликована идея проекта: ${title} (ID: ${docRef.id})`)

    return docRef.id
  } catch (error) {
    console.error(
      `Ошибка при публикации идеи проекта из файла ${filePath}:`,
      error,
    )
    return null
  }
}

// Основная функция для публикации всех идей проектов
async function publishAllProjectIdeas() {
  const publicationsDir = path.join(__dirname, "../publications")

  // Проверка существования директории
  if (!fs.existsSync(publicationsDir)) {
    console.error(`Директория ${publicationsDir} не существует`)
    return
  }

  // Получение списка файлов
  const files = fs
    .readdirSync(publicationsDir)
    .filter((file) => file.endsWith(".md"))
    .sort() // Сортировка файлов по имени

  console.log(`Найдено ${files.length} файлов с идеями проектов`)

  // Публикация каждой идеи проекта
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(publicationsDir, files[i])
    const postId = await publishProjectIdea(filePath, i + 1)

    if (postId) {
      console.log(`Успешно опубликована идея проекта ${i + 1}/${files.length}`)
    }

    // Небольшая задержка между публикациями
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log("Все идеи проектов успешно опубликованы")
}

// Запуск публикации
publishAllProjectIdeas()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
