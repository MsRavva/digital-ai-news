const admin = require("firebase-admin")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function getPosts(includeArchived = true) {
  try {
    // Создаем базовый запрос
    let postsQuery = db.collection("posts")

    // Если не включаем архивированные, добавляем фильтр
    if (!includeArchived) {
      postsQuery = postsQuery.where("archived", "in", [false, null])
    }

    // Получаем все посты
    const snapshot = await postsQuery.get()

    if (snapshot.empty) {
      console.log("Посты не найдены")
      return []
    }

    const posts = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      posts.push({
        id: doc.id,
        title: data.title,
        category: data.category,
        archived: data.archived || false,
      })
    })

    return posts
  } catch (error) {
    console.error("Ошибка при получении постов:", error)
    return []
  }
}

// Проверяем все посты
async function checkPosts() {
  console.log("Получаем все посты (включая архивированные):")
  const allPosts = await getPosts(true)
  console.log(`Всего постов: ${allPosts.length}`)

  // Ищем пост с нужным ID
  const targetId = "ahcqo4NHXvD4RTQk6l0O"
  const targetPost = allPosts.find((post) => post.id === targetId)

  if (targetPost) {
    console.log(`\nПост с ID ${targetId} найден:`)
    console.log(targetPost)
  } else {
    console.log(`\nПост с ID ${targetId} НЕ найден среди всех постов`)
  }

  console.log("\nПолучаем только неархивированные посты:")
  const nonArchivedPosts = await getPosts(false)
  console.log(`Всего неархивированных постов: ${nonArchivedPosts.length}`)

  // Ищем пост с нужным ID среди неархивированных
  const targetNonArchivedPost = nonArchivedPosts.find(
    (post) => post.id === targetId,
  )

  if (targetNonArchivedPost) {
    console.log(`\nПост с ID ${targetId} найден среди неархивированных:`)
    console.log(targetNonArchivedPost)
  } else {
    console.log(
      `\nПост с ID ${targetId} НЕ найден среди неархивированных постов`,
    )
  }
}

checkPosts()
  .then(() => {
    console.log("\nПроверка завершена")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Ошибка:", err)
    process.exit(1)
  })
