const admin = require("firebase-admin")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Функция для получения списка публикаций
async function listPosts() {
  console.log("Получаем список публикаций...")

  try {
    // Получаем все публикации в категории "Идеи для проектов"
    const snapshot = await db
      .collection("posts")
      .where("category", "==", "Идеи для проектов")
      .get()

    if (snapshot.empty) {
      console.log('Публикации в категории "Идеи для проектов" не найдены')
      return
    }

    console.log(
      `Найдено ${snapshot.size} публикаций в категории "Идеи для проектов"`,
    )

    // Выводим информацию о каждой публикации
    snapshot.forEach((doc) => {
      const data = doc.data()
      console.log(`ID: ${doc.id}`)
      console.log(`Заголовок: ${data.title}`)
      console.log(`Автор: ${data.author.displayName} (${data.author.role})`)
      console.log("---")
    })
  } catch (error) {
    console.error("Ошибка при получении списка публикаций:", error)
  }
}

// Запуск функции
listPosts()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
