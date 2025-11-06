const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")

// Инициализация Firebase Admin SDK
let serviceAccount
try {
  serviceAccount = require("../serviceAccountKey.json")
} catch (e) {
  try {
    serviceAccount = require("../firebase-credentials.json")
  } catch (e2) {
    console.error("Не удалось найти файл с учетными данными Firebase")
    process.exit(1)
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// ID публикации
const postId = "czmGedEUqXoYGw8uqSyT"

// Новые теги на русском языке
const newTags = [
  "ИИ",
  "Музыка",
  "Коллаборация",
  "Творчество",
  "NextJS",
  "Firebase",
]

// Функция для обновления тегов публикации
async function updatePostTags(postId, newTags) {
  try {
    // Получаем документ публикации
    const postDoc = await db.collection("posts").doc(postId).get()

    if (!postDoc.exists) {
      console.error(`Публикация с ID ${postId} не найдена`)
      return
    }

    const postData = postDoc.data()

    console.log(`Обновление тегов для публикации с ID ${postId}:`)
    console.log(`Заголовок: ${postData.title}`)
    console.log(
      `Старые теги: ${postData.tags ? postData.tags.join(", ") : "отсутствуют"}`,
    )
    console.log(`Новые теги: ${newTags.join(", ")}`)

    // Обновляем теги в документе публикации
    await db.collection("posts").doc(postId).update({
      tags: newTags,
    })

    console.log("Теги публикации успешно обновлены")

    // Удаляем старые связи с тегами
    const postTagsSnapshot = await db
      .collection("post_tags")
      .where("post_id", "==", postId)
      .get()

    const batch = db.batch()

    postTagsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Создаем новые связи с тегами
    for (const tagName of newTags) {
      // Проверяем, существует ли тег
      const tagsQuery = await db
        .collection("tags")
        .where("name", "==", tagName)
        .get()

      let tagId

      if (tagsQuery.empty) {
        // Создаем новый тег
        const tagRef = db.collection("tags").doc()
        batch.set(tagRef, { name: tagName })
        tagId = tagRef.id
      } else {
        tagId = tagsQuery.docs[0].id
      }

      // Создаем связь поста с тегом
      const postTagRef = db.collection("post_tags").doc()
      batch.set(postTagRef, {
        post_id: postId,
        tag_id: tagId,
      })
    }

    // Выполняем пакетную операцию
    await batch.commit()

    console.log("Связи с тегами успешно обновлены")
  } catch (error) {
    console.error("Ошибка при обновлении тегов публикации:", error)
  }
}

// Запускаем обновление
updatePostTags(postId, newTags)
  .then(() => {
    console.log("Обновление завершено")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
