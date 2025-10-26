const admin = require("firebase-admin")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Теги для публикаций по категориям
const projectIdeasTags = [
  "ИИ",
  "Веб-разработка",
  "Образование",
  "Машинное обучение",
  "Персонализация",
  "Генеративные модели",
  "Анализ данных",
  "Мобильные приложения",
  "3D-моделирование",
  "Компьютерное зрение",
]

// Функция для добавления тегов к публикациям
async function addTagsToPosts() {
  console.log("Начинаем добавление тегов к публикациям...")

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

    console.log(
      `Найдено ${snapshot.size} публикаций в категории "project-ideas"`,
    )

    // Создаем или получаем теги
    const tagIds = {}
    const batch = db.batch()

    // Сначала создаем все теги
    for (const tagName of projectIdeasTags) {
      // Проверяем, существует ли тег
      const tagsSnapshot = await db
        .collection("tags")
        .where("name", "==", tagName)
        .get()

      if (tagsSnapshot.empty) {
        // Создаем новый тег
        const tagRef = db.collection("tags").doc()
        batch.set(tagRef, { name: tagName })
        tagIds[tagName] = tagRef.id
        console.log(`Создан новый тег: ${tagName} (ID: ${tagRef.id})`)
      } else {
        tagIds[tagName] = tagsSnapshot.docs[0].id
        console.log(
          `Использован существующий тег: ${tagName} (ID: ${tagsSnapshot.docs[0].id})`,
        )
      }
    }

    // Выполняем пакетное обновление для создания тегов
    await batch.commit()
    console.log("Все теги созданы или получены")

    // Теперь добавляем теги к публикациям
    let postsUpdated = 0

    for (const doc of snapshot.docs) {
      const postId = doc.id
      const postData = doc.data()

      // Выбираем 3-5 случайных тегов для публикации
      const numTags = Math.floor(Math.random() * 3) + 3 // 3-5 тегов
      const shuffledTags = [...projectIdeasTags].sort(() => 0.5 - Math.random())
      const selectedTags = shuffledTags.slice(0, numTags)

      console.log(
        `Добавляем ${numTags} тегов к публикации: ${postData.title} (ID: ${postId})`,
      )

      // Создаем связи поста с тегами
      const postTagsBatch = db.batch()

      for (const tagName of selectedTags) {
        const tagId = tagIds[tagName]

        // Проверяем, существует ли уже такая связь
        const postTagsSnapshot = await db
          .collection("post_tags")
          .where("post_id", "==", postId)
          .where("tag_id", "==", tagId)
          .get()

        if (postTagsSnapshot.empty) {
          // Создаем связь поста с тегом
          const postTagRef = db.collection("post_tags").doc()
          postTagsBatch.set(postTagRef, {
            post_id: postId,
            tag_id: tagId,
          })
          console.log(`  - Добавлен тег "${tagName}" (ID: ${tagId})`)
        } else {
          console.log(
            `  - Тег "${tagName}" (ID: ${tagId}) уже связан с публикацией`,
          )
        }
      }

      // Выполняем пакетное обновление для связей поста с тегами
      await postTagsBatch.commit()
      postsUpdated++
    }

    console.log(`Теги добавлены к ${postsUpdated} публикациям`)
  } catch (error) {
    console.error("Ошибка при добавлении тегов к публикациям:", error)
  }
}

// Запуск добавления тегов
addTagsToPosts()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
