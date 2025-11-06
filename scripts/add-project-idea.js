const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// ID автора (Василий Смирнов)
const authorId = "vasily_smirnov" // Это ID нужно заменить на реальный ID пользователя

// Данные публикации
const postData = {
  title:
    "Персональный образовательный ассистент на базе ИИ: идеальный проект для начинающих разработчиков",
  content: fs.readFileSync(
    path.join(__dirname, "../publication-content.md"),
    "utf8",
  ),
  category: "project-ideas",
  tags: ["ИИ", "Образование", "Веб-разработка", "API", "LLM", "Персонализация"],
}

// Функция для создания поста
async function createPost(postData) {
  try {
    // Проверяем, существует ли пользователь
    const userDoc = await db.collection("profiles").doc(authorId).get()

    if (!userDoc.exists) {
      console.log(`Пользователь с ID ${authorId} не найден. Создаем профиль...`)

      // Создаем профиль пользователя, если он не существует
      await db.collection("profiles").doc(authorId).set({
        id: authorId,
        username: "Василий Смирнов",
        role: "teacher",
        created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
      })

      console.log(
        `Создан профиль для пользователя: Василий Смирнов (ID: ${authorId})`,
      )
    }

    // Создаем пост
    const postRef = db.collection("posts").doc()
    await postRef.set({
      title: postData.title,
      content: postData.content,
      category: postData.category,
      author_id: authorId,
      created_at: admin.firestore.Timestamp.now(),
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
    })

    console.log(`Создан пост: ${postData.title} (ID: ${postRef.id})`)

    // Обрабатываем теги
    const batch = db.batch()

    for (const tagName of postData.tags) {
      // Проверяем, существует ли тег
      const tagsSnapshot = await db
        .collection("tags")
        .where("name", "==", tagName)
        .get()

      let tagId

      if (tagsSnapshot.empty) {
        // Создаем новый тег
        const tagRef = db.collection("tags").doc()
        batch.set(tagRef, { name: tagName })
        tagId = tagRef.id
        console.log(`Создан новый тег: ${tagName} (ID: ${tagId})`)
      } else {
        tagId = tagsSnapshot.docs[0].id
        console.log(`Использован существующий тег: ${tagName} (ID: ${tagId})`)
      }

      // Создаем связь поста с тегом
      const postTagRef = db.collection("post_tags").doc()
      batch.set(postTagRef, {
        post_id: postRef.id,
        tag_id: tagId,
      })
    }

    // Выполняем batch операции
    await batch.commit()

    console.log(`Публикация успешно создана с ID: ${postRef.id}`)
    return postRef.id
  } catch (error) {
    console.error("Ошибка при создании публикации:", error)
    return null
  }
}

// Выполняем создание поста
createPost(postData)
  .then(() => {
    console.log("Скрипт успешно выполнен")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
