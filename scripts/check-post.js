// Скрипт для проверки публикации по ID
const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccountKey.json")

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

async function checkPost(postId) {
  try {
    console.log(`Проверка публикации с ID: ${postId}`)

    // Получаем документ публикации
    const postDoc = await db.collection("posts").doc(postId).get()

    if (!postDoc.exists) {
      console.log(`Публикация с ID ${postId} не найдена`)
      return
    }

    // Получаем данные публикации
    const postData = postDoc.data()
    console.log("Данные публикации:")
    console.log(JSON.stringify(postData, null, 2))

    // Проверяем, архивирована ли публикация
    console.log(`Архивирована: ${postData.archived ? "Да" : "Нет"}`)

    // Получаем теги публикации
    const postTagsSnapshot = await db
      .collection("post_tags")
      .where("post_id", "==", postId)
      .get()

    const tagIds = []
    postTagsSnapshot.forEach((doc) => {
      tagIds.push(doc.data().tag_id)
    })

    if (tagIds.length > 0) {
      console.log("Теги публикации:")

      // Получаем имена тегов
      for (const tagId of tagIds) {
        const tagDoc = await db.collection("tags").doc(tagId).get()
        if (tagDoc.exists) {
          console.log(`- ${tagDoc.data().name} (ID: ${tagId})`)
        }
      }
    } else {
      console.log("У публикации нет тегов")
    }

    // Проверяем автора
    if (postData.author_id) {
      const authorDoc = await db
        .collection("profiles")
        .doc(postData.author_id)
        .get()
      if (authorDoc.exists) {
        console.log("Автор публикации:")
        console.log(JSON.stringify(authorDoc.data(), null, 2))
      } else {
        console.log(`Автор с ID ${postData.author_id} не найден`)
      }
    }

    // Получаем статистику
    const likesSnapshot = await db
      .collection("likes")
      .where("post_id", "==", postId)
      .get()

    const commentsSnapshot = await db
      .collection("comments")
      .where("post_id", "==", postId)
      .get()

    const viewsSnapshot = await db
      .collection("views")
      .where("post_id", "==", postId)
      .get()

    console.log("Статистика:")
    console.log(`- Лайки: ${likesSnapshot.size}`)
    console.log(`- Комментарии: ${commentsSnapshot.size}`)
    console.log(`- Просмотры: ${viewsSnapshot.size}`)
  } catch (error) {
    console.error("Ошибка при проверке публикации:", error)
  }
}

// Проверяем публикацию с указанным ID
const postId = process.argv[2] || "ahcqo4NHXvD4RTQk6l0O"
checkPost(postId).then(() => process.exit())
