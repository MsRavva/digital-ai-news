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

// Получаем ID публикации и новые теги из аргументов командной строки
const postId = process.argv[2]
const tagsArg = process.argv[3]

if (!postId || !tagsArg) {
  console.error("Необходимо указать ID публикации и теги")
  console.log(
    'Использование: node update-post-tags.js <post_id> "tag1,tag2,tag3"',
  )
  process.exit(1)
}

// Преобразуем строку с тегами в массив
const newTags = tagsArg.split(",").map((tag) => tag.trim())

// Русские эквиваленты английских тегов
const tagTranslations = {
  AI: "ИИ",
  SpeechRecognition: "РаспознаваниеРечи",
  EmotionAnalysis: "АнализЭмоций",
  PublicSpeaking: "ПубличныеВыступления",
  NextJS: "NextJS",
  Firebase: "Firebase",
  LanguageLearning: "ИзучениеЯзыков",
  Translation: "Перевод",
  ImageGeneration: "ГенерацияИзображений",
  Supabase: "Supabase",
}

// Переводим теги на русский, если есть перевод
const translatedTags = newTags.map((tag) => tagTranslations[tag] || tag)

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
    console.log(`Исходные теги: ${newTags.join(", ")}`)
    console.log(`Переведенные теги: ${translatedTags.join(", ")}`)

    // Обновляем теги в документе публикации
    await db.collection("posts").doc(postId).update({
      tags: newTags, // Сохраняем исходные теги в поле tags
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

    // Создаем новые связи с тегами (используем переведенные теги)
    for (const tagName of translatedTags) {
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
updatePostTags(postId, translatedTags)
  .then(() => {
    console.log("Обновление завершено")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
