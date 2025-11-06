const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const postId = "ahcqo4NHXvD4RTQk6l0O"

// Получаем текущую дату в формате Firestore Timestamp
const now = admin.firestore.Timestamp.now()

// Обновляем дату создания публикации
db.collection("posts")
  .doc(postId)
  .update({
    created_at: now,
    updated_at: now,
  })
  .then(() => {
    console.log(
      `Дата публикации ${postId} успешно обновлена на текущую:`,
      now.toDate(),
    )

    // Проверяем обновленную публикацию
    return db.collection("posts").doc(postId).get()
  })
  .then((doc) => {
    if (doc.exists) {
      const data = doc.data()
      console.log("Обновленные данные публикации:")
      console.log("- Заголовок:", data.title)
      console.log("- Дата создания:", data.created_at.toDate())
      console.log("- Дата обновления:", data.updated_at.toDate())
      console.log("- Архивирована:", data.archived ? "Да" : "Нет")
    }
  })
  .catch((err) => {
    console.error("Ошибка при обновлении даты публикации:", err)
  })
  .finally(() => {
    console.log("Операция завершена")
  })
