const admin = require("firebase-admin")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Функция для обновления категорий публикаций
async function updatePostCategories() {
  console.log("Начинаем обновление категорий публикаций...")

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

    // Обновляем категорию в каждой публикации
    const batch = db.batch()
    snapshot.forEach((doc) => {
      const postRef = db.collection("posts").doc(doc.id)
      batch.update(postRef, {
        category: "project-ideas", // Меняем категорию на "project-ideas"
      })
      console.log(
        `Подготовлено обновление для публикации: ${doc.data().title} (ID: ${doc.id})`,
      )
    })

    // Выполняем пакетное обновление
    await batch.commit()
    console.log("Все публикации успешно обновлены")
  } catch (error) {
    console.error("Ошибка при обновлении категорий публикаций:", error)
  }
}

// Запуск обновления
updatePostCategories()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
