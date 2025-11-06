// Скрипт для получения только заголовков идей проектов
const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccountKey.json")

// Инициализируем Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

// Получаем ссылку на Firestore
const db = admin.firestore()

async function listProjectTitles() {
  try {
    console.log("Получаем заголовки идей проектов...")

    // Получаем только заголовки публикаций в категории "project-ideas"
    const snapshot = await db
      .collection("posts")
      .where("category", "==", "project-ideas")
      .select("title", "archived") // Запрашиваем только заголовок и статус архивации
      .get()

    if (snapshot.empty) {
      console.log('Публикации в категории "project-ideas" не найдены')
      return
    }

    // Разделяем на активные и архивированные
    const active = []
    const archived = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      const item = {
        title: data.title,
        archived: data.archived || false,
      }

      if (data.archived) {
        archived.push(item)
      } else {
        active.push(item)
      }
    })

    // Выводим активные идеи проектов
    console.log(`\nАктивные идеи проектов (${active.length}):`)
    active.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`)
    })

    // Выводим архивированные идеи проектов
    console.log(`\nАрхивированные идеи проектов (${archived.length}):`)
    archived.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`)
    })
  } catch (error) {
    console.error("Ошибка при получении заголовков идей проектов:", error)
  }
}

// Запускаем функцию
listProjectTitles()
  .then(() => {
    console.log("\nСкрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка выполнения скрипта:", error)
    process.exit(1)
  })
