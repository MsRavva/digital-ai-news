const admin = require("firebase-admin")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Функция для проверки публикаций
async function checkPosts() {
  console.log("Проверяем публикации...")

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

    // Выводим информацию о каждой публикации
    snapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`ID: ${doc.id}`)
      console.log(`Заголовок: ${data.title}`)

      // Проверяем наличие информации об авторе
      if (data.author && data.author.displayName) {
        console.log(
          `Автор: ${data.author.displayName} (${data.author.role || "неизвестно"})`,
        )
      } else if (data.author && data.author.username) {
        console.log(
          `Автор: ${data.author.username} (${data.author.role || "неизвестно"})`,
        )
      } else {
        console.log("Автор: информация отсутствует")
      }

      console.log(`Категория: ${data.category}`)
      console.log(`Архивирован: ${data.archived ? "Да" : "Нет"}`)
      console.log("---")
    })
  } catch (error) {
    console.error("Ошибка при проверке публикаций:", error)
  }
}

// Запуск проверки
checkPosts()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
