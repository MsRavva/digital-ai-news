const admin = require("firebase-admin")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// ID публикации, которую нужно исправить
const postId = "TClmP1aBnhBPKG6BcvDR"

// Функция для исправления информации об авторе публикации
async function fixPostAuthor() {
  console.log(`Исправляем информацию об авторе публикации с ID: ${postId}`)

  try {
    // Получаем публикацию
    const postDoc = await db.collection("posts").doc(postId).get()

    if (!postDoc.exists) {
      console.log(`Публикация с ID ${postId} не найдена`)
      return
    }

    const postData = postDoc.data()
    console.log("Текущие данные публикации:", postData)

    // Обновляем информацию об авторе
    await db
      .collection("posts")
      .doc(postId)
      .update({
        author: {
          uid: "vasily-smirnov",
          displayName: "Василий Смирнов",
          role: "student",
        },
      })

    console.log("Информация об авторе успешно обновлена")
  } catch (error) {
    console.error("Ошибка при исправлении информации об авторе:", error)
  }
}

// Запуск исправления
fixPostAuthor()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
