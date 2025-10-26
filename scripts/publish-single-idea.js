const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")
const matter = require("gray-matter")

// Инициализация Firebase Admin SDK
let serviceAccount
try {
  serviceAccount = require("../serviceAccountKey.json")
} catch (e) {
  try {
    serviceAccount = require("../firebase-credentials.json")
  } catch (e2) {
    console.error("Не удалось найти файл с учетными данными Firebase")
    process.exit(1)
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Функция для публикации идеи проекта из файла
async function publishProjectIdea(filePath) {
  try {
    console.log(`Публикация идеи проекта из файла: ${filePath}`)

    // Чтение содержимого файла
    const fileContent = fs.readFileSync(filePath, "utf8")

    // Парсинг frontmatter и содержимого
    const { data, content } = matter(fileContent)

    // Извлечение заголовка и категории из frontmatter
    const title = data.title
    const category = data.category

    // Извлечение тегов из содержимого
    const tagsMatch = content.match(/\*\*Теги\*\*:\s*(.*?)$/m)
    const tags = tagsMatch
      ? tagsMatch[1]
          .trim()
          .split("#")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : []

    console.log(`Заголовок: ${title}`)
    console.log(`Категория: ${category}`)
    console.log(`Теги: ${tags.join(", ")}`)

    // Создание документа публикации
    const postData = {
      title: title,
      content: content,
      category: category,
      author_id: "4J9Vf4tqKOU7vDcz99h6nBu0gHx2", // ID Василия Смирнова
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      likesCount: 0,
      viewsCount: 0,
      commentsCount: 0,
      archived: false,
      tags: tags,
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

// Путь к файлу с идеей
const ideaFilePath = path.join(__dirname, "../publications/idea-1-19.04.25.md")

// Публикация идеи
publishProjectIdea(ideaFilePath)
  .then((postId) => {
    if (postId) {
      console.log(`Идея успешно опубликована с ID: ${postId}`)
    } else {
      console.error("Не удалось опубликовать идею")
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
