const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const postId = "ahcqo4NHXvD4RTQk6l0O"

async function fixPostVisibility() {
  try {
    // Получаем документ публикации
    const postDoc = await db.collection("posts").doc(postId).get()

    if (!postDoc.exists) {
      console.log(`Публикация с ID ${postId} не найдена`)
      return
    }

    const postData = postDoc.data()
    console.log("Текущие данные публикации:")
    console.log("- Заголовок:", postData.title)
    console.log("- Категория:", postData.category)
    console.log("- Архивирована:", postData.archived || false)
    console.log(
      "- Дата создания:",
      postData.created_at ? postData.created_at.toDate() : null,
    )

    // Проверяем, есть ли поле archived и устанавливаем его в false
    if (postData.archived === undefined || postData.archived === null) {
      console.log(
        "\nПоле archived отсутствует, добавляем его со значением false",
      )
    } else if (postData.archived === true) {
      console.log("\nПоле archived установлено в true, меняем на false")
    } else {
      console.log("\nПоле archived уже установлено в false")
    }

    // Обновляем публикацию
    await db.collection("posts").doc(postId).update({
      archived: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log("\nПубликация обновлена")

    // Проверяем, что публикация обновлена
    const updatedPostDoc = await db.collection("posts").doc(postId).get()
    const updatedPostData = updatedPostDoc.data()

    console.log("\nОбновленные данные публикации:")
    console.log("- Заголовок:", updatedPostData.title)
    console.log("- Категория:", updatedPostData.category)
    console.log("- Архивирована:", updatedPostData.archived || false)
    console.log(
      "- Дата создания:",
      updatedPostData.created_at ? updatedPostData.created_at.toDate() : null,
    )
    console.log(
      "- Дата обновления:",
      updatedPostData.updated_at ? updatedPostData.updated_at.toDate() : null,
    )

    // Проверяем, что публикация видна в запросе
    console.log("\nПроверяем, что публикация видна в запросе:")

    const postsQuery = db
      .collection("posts")
      .where("archived", "in", [false, null])
      .where("category", "==", updatedPostData.category)
      .orderBy("created_at", "desc")
      .limit(20)

    const postsSnapshot = await postsQuery.get()

    if (postsSnapshot.empty) {
      console.log("Публикации не найдены")
      return
    }

    let found = false
    postsSnapshot.forEach((doc) => {
      if (doc.id === postId) {
        found = true
        console.log(`Публикация с ID ${postId} найдена в результатах запроса`)
      }
    })

    if (!found) {
      console.log(`Публикация с ID ${postId} НЕ найдена в результатах запроса`)
    }
  } catch (error) {
    console.error("Ошибка при исправлении видимости публикации:", error)
  }
}

fixPostVisibility()
  .then(() => {
    console.log("\nОперация завершена")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Ошибка:", err)
    process.exit(1)
  })
