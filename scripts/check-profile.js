const admin = require("firebase-admin")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Функция для проверки профиля
async function checkProfile() {
  console.log("Проверяем профиль Василия Смирнова...")

  try {
    // Проверяем профиль с ID vasily_smirnov
    const profileDoc = await db
      .collection("profiles")
      .doc("vasily_smirnov")
      .get()

    if (profileDoc.exists) {
      console.log("Профиль найден:")
      console.log(profileDoc.data())
    } else {
      console.log("Профиль не найден. Создаем новый профиль...")

      // Создаем новый профиль
      const profileData = {
        username: "Василий Смирнов",
        role: "teacher",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await db.collection("profiles").doc("vasily_smirnov").set(profileData)
      console.log("Профиль успешно создан")
    }
  } catch (error) {
    console.error("Ошибка при проверке профиля:", error)
  }
}

// Запуск проверки
checkProfile()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
