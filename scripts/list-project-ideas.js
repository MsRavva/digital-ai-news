const admin = require("firebase-admin")

// Инициализация Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// Функция для получения всех идей проектов (активных и архивированных)
async function listProjectIdeas() {
  console.log("Получаем список идей проектов...")

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

    // Разделяем на активные и архивированные
    const active = []
    const archived = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      const item = {
        id: doc.id,
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

    console.log(`\nВсего идей проектов: ${active.length + archived.length}`)
  } catch (error) {
    console.error("Ошибка при получении списка идей проектов:", error)
  }
}

// Запуск функции
listProjectIdeas()
  .then(() => {
    console.log("\nСкрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
