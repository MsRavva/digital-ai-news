// Простой скрипт для проверки публикации
const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccountKey.json")

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

async function checkPost() {
  try {
    const postId = "ahcqo4NHXvD4RTQk6l0O"
    console.log(`Проверка публикации ${postId}`)

    const postDoc = await db.collection("posts").doc(postId).get()

    if (postDoc.exists) {
      const data = postDoc.data()
      console.log("Публикация найдена:")
      console.log(`- Заголовок: ${data.title}`)
      console.log(`- Категория: ${data.category}`)
      console.log(`- Архивирована: ${data.archived ? "Да" : "Нет"}`)

      // Проверяем запрос с фильтром по категории news
      console.log("\nПроверка запроса с категорией news:")
      const newsQuery = await db
        .collection("posts")
        .where("category", "==", "news")
        .where("archived", "in", [false, null])
        .orderBy("created_at", "desc")
        .limit(10)
        .get()

      console.log(`Найдено публикаций: ${newsQuery.size}`)

      // Проверяем, есть ли наша публикация в результатах
      const found = newsQuery.docs.some((doc) => doc.id === postId)
      console.log(
        `Публикация ${postId} ${found ? "найдена" : "не найдена"} в результатах запроса`,
      )

      if (!found && data.category === "news") {
        console.log(
          "ПРОБЛЕМА: Публикация должна быть в результатах, но её нет!",
        )
      }
    } else {
      console.log("Публикация не найдена")
    }
  } catch (error) {
    console.error("Ошибка:", error)
  }
}

checkPost().then(() => process.exit())
