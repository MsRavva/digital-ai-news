const admin = require("firebase-admin")
let serviceAccount

// Пытаемся получить учетные данные из переменной окружения или из файла
try {
  // Сначала проверяем, есть ли переменная окружения
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log(
      "Используем учетные данные из переменной окружения FIREBASE_SERVICE_ACCOUNT_KEY",
    )
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  } else {
    // Если переменной нет, пытаемся загрузить файл
    console.log(
      "Пытаемся загрузить учетные данные из файла serviceAccountKey.json",
    )
    serviceAccount = require("../serviceAccountKey.json")
  }

  // Инициализируем Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
} catch (error) {
  console.error("Ошибка при инициализации Firebase Admin SDK:")
  console.error(error.message)
  console.error(
    "Убедитесь, что файл serviceAccountKey.json существует или переменная окружения FIREBASE_SERVICE_ACCOUNT_KEY установлена.",
  )
  process.exit(1)
}

const db = admin.firestore()
const postId = "ahcqo4NHXvD4RTQk6l0O"

// Простая функция для исправления публикации
async function simpleFixPost() {
  try {
    console.log(`Исправляем публикацию с ID: ${postId}`)

    // Обновляем публикацию, устанавливая все необходимые поля
    await db.collection("posts").doc(postId).update({
      archived: false,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now(),
    })

    console.log("Публикация обновлена")

    // Проверяем, что публикация обновлена
    const updatedDoc = await db.collection("posts").doc(postId).get()
    const updatedData = updatedDoc.data()

    console.log("\nОбновленные данные:")
    console.log("- Заголовок:", updatedData.title)
    console.log("- Архивирована:", updatedData.archived)
    console.log("- Дата создания:", updatedData.created_at.toDate())

    console.log("\nПубликация должна теперь отображаться корректно")
  } catch (error) {
    console.error("Ошибка при исправлении публикации:", error)
  }
}

simpleFixPost()
  .then(() => {
    console.log("Операция завершена")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Ошибка:", err)
    process.exit(1)
  })
