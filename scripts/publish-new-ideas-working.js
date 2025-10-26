const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Функция для чтения содержимого файла
function readMarkdownFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8")
  } catch (error) {
    console.error(`Ошибка при чтении файла ${filePath}:`, error)
    return null
  }
}

// Функция для публикации идеи проекта
async function publishProjectIdea(filePath, index) {
  try {
    const content = readMarkdownFile(filePath)
    if (!content) return null

    // Извлечение заголовка (первая строка, начинающаяся с #)
    const titleMatch = content.match(/^# (.+)$/m)
    const title = titleMatch ? titleMatch[1] : `Идея проекта ${index}`

    // Извлечение первого абзаца после ## Введение как описание
    const descriptionMatch = content.match(/## Введение\s+(.+?)(?=\s*##|\s*$)/s)
    const description = descriptionMatch
      ? descriptionMatch[1].trim().substring(0, 200) + "..."
      : "Описание идеи проекта..."

    // Извлечение тегов из раздела "Теги"
    const tagsMatch = content.match(/##.+?Теги:(.+?)(?=\s*##|\s*$)/s)
    const tagsText = tagsMatch ? tagsMatch[1].trim() : ""
    const tags = tagsText
      .split("#")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    // Создание документа публикации
    const postData = {
      title: title,
      content: content,
      description: description,
      author: {
        uid: "4J9Vf4tqKOU7vDcz99h6nBu0gHx2", // ID пользователя Василий Смирнов
        displayName: "Василий Смирнов",
        role: "teacher",
      },
      category: "project-ideas",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      likes: 0,
      views: 0,
      archived: false, // Добавляем флаг архива
    }

    // Добавляем теги, если они есть
    if (tags.length > 0) {
      postData.tags = tags
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

// Основная функция для публикации новых идей проектов
async function publishNewIdeas() {
  const ideasToPublish = [
    "idea-infographics-ai.md",
    "idea-music-collaboration-ai.md",
    "idea-historical-atlas-ai.md",
    "idea-news-analyzer-ai.md",
    "idea-ai-language-learning-assistant.md",
  ]

  const publicationsDir = path.join(__dirname, "../publications")

  console.log(
    `Начинаем публикацию ${ideasToPublish.length} новых идей проектов`,
  )

  // Публикация каждой идеи проекта
  for (let i = 0; i < ideasToPublish.length; i++) {
    const filePath = path.join(publicationsDir, ideasToPublish[i])

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      console.error(`Файл ${filePath} не существует`)
      continue
    }

    const postId = await publishProjectIdea(filePath, i + 1)

    if (postId) {
      console.log(
        `Успешно опубликована идея проекта ${i + 1}/${ideasToPublish.length}`,
      )
    }

    // Небольшая задержка между публикациями
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log("Все новые идеи проектов успешно опубликованы")
}

// Запуск публикации
publishNewIdeas()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
