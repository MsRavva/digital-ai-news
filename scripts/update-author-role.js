const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")

// Инициализация Firebase Admin SDK, если еще не инициализирован
if (admin.apps.length === 0) {
  const serviceAccount = require("../serviceAccountKey.json")
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

// Функция для обновления роли автора в публикациях
async function updateAuthorRole() {
  console.log("Начинаем обновление роли автора...")
  try {
    // Получаем все публикации Василия Смирнова
    const snapshot = await db
      .collection("posts")
      .where("author.displayName", "==", "Василий Смирнов")
      .get()

    if (snapshot.empty) {
      console.log("Публикации Василия Смирнова не найдены")
      return
    }

    console.log(`Найдено ${snapshot.size} публикаций Василия Смирнова`)

    // Обновляем роль автора в каждой публикации
    const batch = db.batch()
    snapshot.forEach((doc) => {
      const postRef = db.collection("posts").doc(doc.id)
      batch.update(postRef, {
        "author.role": "student", // Меняем роль на "ученик"
      })
      console.log(
        `Подготовлено обновление для публикации: ${doc.data().title} (ID: ${doc.id})`,
      )
    })

    // Выполняем пакетное обновление
    await batch.commit()
    console.log("Все публикации успешно обновлены")
  } catch (error) {
    console.error("Ошибка при обновлении роли автора:", error)
  }
}

// Запуск обновления
updateAuthorRole()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
