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
    const tagsText = tagsMatch ? tagsMatch[1].trim() : ""
    const tags = tagsText
      .split("#")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

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

    // Создаем связи с тегами
    const batch = db.batch()

    for (const tagName of tags) {
      // Проверяем, существует ли тег
      const tagsQuery = await db
        .collection("tags")
        .where("name", "==", tagName)
        .get()

      let tagId

      if (tagsQuery.empty) {
        // Создаем новый тег
        const tagRef = db.collection("tags").doc()
        batch.set(tagRef, { name: tagName })
        tagId = tagRef.id
      } else {
        tagId = tagsQuery.docs[0].id
      }

      // Создаем связь поста с тегом
      const postTagRef = db.collection("post_tags").doc()
      batch.set(postTagRef, {
        post_id: docRef.id,
        tag_id: tagId,
      })
    }

    // Выполняем пакетную операцию
    await batch.commit()

    return docRef.id
  } catch (error) {
    console.error(
      `Ошибка при публикации идеи проекта из файла ${filePath}:`,
      error,
    )
    return null
  }
}

// Функция для публикации всех оставшихся идей
async function publishRemainingIdeas() {
  try {
    // Список файлов с идеями для публикации
    const ideasToPublish = [
      "idea-2-19.04.25.md",
      "idea-3-19.04.25.md",
      "idea-4-19.04.25.md",
      "idea-5-19.04.25.md",
      "idea-6-19.04.25.md",
    ]

    const publicationsDir = path.join(__dirname, "../publications")

    console.log(`Начинаем публикацию ${ideasToPublish.length} идей проектов`)

    // Публикация каждой идеи проекта
    for (let i = 0; i < ideasToPublish.length; i++) {
      const filePath = path.join(publicationsDir, ideasToPublish[i])

      // Проверяем существование файла
      if (!fs.existsSync(filePath)) {
        console.error(`Файл ${filePath} не существует`)
        continue
      }

      const postId = await publishProjectIdea(filePath)

      if (postId) {
        console.log(
          `Успешно опубликована идея проекта ${i + 1}/${ideasToPublish.length} (ID: ${postId})`,
        )
      }

      // Небольшая задержка между публикациями
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    console.log("Все идеи проектов успешно опубликованы")
  } catch (error) {
    console.error("Ошибка при публикации идей проектов:", error)
  }
}

// Запускаем публикацию
publishRemainingIdeas()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
