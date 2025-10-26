// Скрипт для обновления тегов в опубликованных идеях проектов
const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")

// Инициализируем Firebase Admin SDK, если еще не инициализирован
if (admin.apps.length === 0) {
  const serviceAccount = require("../serviceAccountKey.json")
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

// Получаем ссылку на Firestore
const db = admin.firestore()

// Функция для извлечения тегов из файла
function extractTagsFromFile(filePath) {
  try {
    // Чтение содержимого файла
    const content = fs.readFileSync(filePath, "utf8")

    // Извлечение тегов
    const tagsMatch = content.match(/\*\*Теги\*\*: (.+)/)
    if (!tagsMatch) {
      console.log(`Теги не найдены в файле: ${filePath}`)
      return []
    }

    const tagsString = tagsMatch[1].trim()
    const tags = tagsString
      .split(/[,\s#]+/)
      .filter((tag) => tag.length > 0)
      .map((tag) => tag.trim())

    return tags
  } catch (error) {
    console.error(`Ошибка при извлечении тегов из файла ${filePath}:`, error)
    return []
  }
}

// Функция для извлечения заголовка из файла
function extractTitleFromFile(filePath) {
  try {
    // Чтение содержимого файла
    const content = fs.readFileSync(filePath, "utf8")

    // Извлечение заголовка (первая строка, начинающаяся с #)
    const titleMatch = content.match(/^# (.+)$/m)
    if (!titleMatch) {
      console.log(`Заголовок не найден в файле: ${filePath}`)
      return null
    }

    return titleMatch[1].trim()
  } catch (error) {
    console.error(
      `Ошибка при извлечении заголовка из файла ${filePath}:`,
      error,
    )
    return null
  }
}

// Функция для обновления тегов в опубликованной идее проекта
async function updateProjectIdeaTags(postId, tags) {
  try {
    await db.collection("posts").doc(postId).update({
      tags: tags,
    })
    console.log(`Обновлены теги для публикации ${postId}: ${tags.join(", ")}`)
    return true
  } catch (error) {
    console.error(
      `Ошибка при обновлении тегов для публикации ${postId}:`,
      error,
    )
    return false
  }
}

// Основная функция для обновления тегов во всех идеях проектов
async function updateAllProjectIdeasTags() {
  try {
    // Получаем все публикации в категории "project-ideas"
    const snapshot = await db
      .collection("posts")
      .where("category", "==", "project-ideas")
      .get()

    if (snapshot.empty) {
      console.log('Публикации в категории "project-ideas" не найдены')
      return
    }

    const publicationsDir = path.join(__dirname, "../publications")
    const ideaFiles = fs
      .readdirSync(publicationsDir)
      .filter((file) => file.match(/idea-\d+-22\.04\.25\.md/))
      .sort((a, b) => {
        // Сортировка по номеру идеи
        const numA = Number.parseInt(a.match(/idea-(\d+)/)[1])
        const numB = Number.parseInt(b.match(/idea-(\d+)/)[1])
        return numA - numB
      })

    console.log(`Найдено ${ideaFiles.length} файлов с идеями проектов`)

    // Создаем карту заголовков и тегов из файлов
    const titleToTagsMap = new Map()
    for (const file of ideaFiles) {
      const filePath = path.join(publicationsDir, file)
      const title = extractTitleFromFile(filePath)
      const tags = extractTagsFromFile(filePath)

      if (title && tags.length > 0) {
        titleToTagsMap.set(title, tags)
      }
    }

    console.log(
      `Создана карта заголовков и тегов для ${titleToTagsMap.size} идей проектов`,
    )

    // Обновляем теги в публикациях
    let updatedCount = 0
    snapshot.forEach((doc) => {
      const data = doc.data()
      const title = data.title

      if (titleToTagsMap.has(title)) {
        const tags = titleToTagsMap.get(title)
        updateProjectIdeaTags(doc.id, tags).then((success) => {
          if (success) {
            updatedCount++
          }
        })
      } else {
        console.log(`Не найдены теги для публикации "${title}"`)
      }
    })

    console.log(`Обновлены теги для ${updatedCount} публикаций`)
  } catch (error) {
    console.error("Ошибка при обновлении тегов:", error)
  }
}

// Запускаем обновление тегов
updateAllProjectIdeasTags()
  .then(() => {
    console.log("Скрипт завершен успешно")
    setTimeout(() => process.exit(0), 5000) // Даем время для завершения асинхронных операций
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
