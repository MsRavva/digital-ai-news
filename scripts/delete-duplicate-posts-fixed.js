const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccountKey.json")

// Инициализация Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

// Функция для безопасного преобразования даты
function safeParseDate(dateValue) {
  if (!dateValue) return new Date(0) // Возвращаем начало эпохи, если дата отсутствует

  try {
    // Если это объект Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate()
    }

    // Если это строка в формате ISO
    if (typeof dateValue === "string") {
      const date = new Date(dateValue)
      // Проверяем, что дата валидна
      if (!isNaN(date.getTime())) {
        return date
      }
    }

    // Если это число (миллисекунды)
    if (typeof dateValue === "number") {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date
      }
    }

    // Если это объект Date
    if (dateValue instanceof Date) {
      if (!isNaN(dateValue.getTime())) {
        return dateValue
      }
    }

    // Если ничего не подходит, возвращаем текущую дату
    return new Date()
  } catch (error) {
    console.warn("Ошибка при парсинге даты:", error)
    return new Date() // Возвращаем текущую дату в случае ошибки
  }
}

// Функция для безопасного форматирования даты
function safeFormatDate(dateValue) {
  try {
    const date = safeParseDate(dateValue)
    return date.toISOString()
  } catch (error) {
    return "Invalid Date"
  }
}

async function findAndDeleteDuplicatePosts() {
  try {
    console.log("Поиск дубликатов публикаций...")

    // Получаем все публикации
    const postsSnapshot = await db.collection("posts").get()
    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Всего найдено ${posts.length} публикаций`)

    // Группируем публикации по заголовку
    const groupedByTitle = {}

    posts.forEach((post) => {
      if (!post.title) return // Пропускаем публикации без заголовка

      if (!groupedByTitle[post.title]) {
        groupedByTitle[post.title] = []
      }

      groupedByTitle[post.title].push(post)
    })

    // Находим группы с одинаковыми заголовками
    const potentialDuplicateGroups = Object.values(groupedByTitle).filter(
      (group) => group.length > 1,
    )

    if (potentialDuplicateGroups.length === 0) {
      console.log("Потенциальных дубликатов не найдено.")
      return
    }

    console.log(
      `Найдено ${potentialDuplicateGroups.length} групп с одинаковыми заголовками.`,
    )

    // Теперь проверяем содержимое в каждой группе
    const duplicateGroups = []

    potentialDuplicateGroups.forEach((group) => {
      const contentGroups = {}

      group.forEach((post) => {
        const content = post.content || ""
        if (!contentGroups[content]) {
          contentGroups[content] = []
        }
        contentGroups[content].push(post)
      })

      // Добавляем группы с одинаковым содержимым
      Object.values(contentGroups)
        .filter((contentGroup) => contentGroup.length > 1)
        .forEach((contentGroup) => duplicateGroups.push(contentGroup))
    })

    if (duplicateGroups.length === 0) {
      console.log("Дубликатов публикаций не найдено.")
      return
    }

    console.log(`Найдено ${duplicateGroups.length} групп дубликатов:`)

    // Массив для хранения ID публикаций, которые нужно удалить
    const postsToDelete = []

    // Для каждой группы дубликатов оставляем только одну публикацию (самую старую)
    duplicateGroups.forEach((group, index) => {
      console.log(`\nГруппа ${index + 1}:`)
      console.log(`Заголовок: ${group[0].title}`)
      console.log(`Количество дубликатов: ${group.length}`)

      // Сортируем по дате создания (от старых к новым)
      group.sort((a, b) => {
        const dateA = safeParseDate(a.created_at)
        const dateB = safeParseDate(b.created_at)
        return dateA.getTime() - dateB.getTime()
      })

      // Оставляем самую старую публикацию, остальные помечаем на удаление
      const keepPost = group[0]
      const duplicatesToDelete = group.slice(1)

      console.log(
        `Оставляем: ${keepPost.title} (ID: ${keepPost.id}, Дата: ${safeFormatDate(keepPost.created_at)})`,
      )
      console.log("Удаляем:")

      duplicatesToDelete.forEach((post) => {
        console.log(
          `- ${post.title} (ID: ${post.id}, Дата: ${safeFormatDate(post.created_at)})`,
        )
        postsToDelete.push(post.id)
      })
    })

    if (postsToDelete.length === 0) {
      console.log("Нет публикаций для удаления.")
      return
    }

    console.log(`\nВсего будет удалено ${postsToDelete.length} дубликатов.`)
    console.log("Удаление дубликатов...")

    // Разбиваем массив ID на части по 5 элементов для более надежной обработки
    const chunks = []
    for (let i = 0; i < postsToDelete.length; i += 5) {
      chunks.push(postsToDelete.slice(i, i + 5))
    }

    // Удаляем публикации по частям
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(
        `Обработка части ${i + 1}/${chunks.length} (${chunk.length} публикаций)...`,
      )

      for (const postId of chunk) {
        await deletePost(postId)
        console.log(`Удален дубликат с ID: ${postId}`)
      }
    }

    console.log("\nВсе дубликаты успешно удалены!")
  } catch (error) {
    console.error("Ошибка при удалении дубликатов:", error)
  }
}

// Функция для каскадного удаления публикации и связанных данных
async function deletePost(postId) {
  try {
    // Удаляем пост
    await db.collection("posts").doc(postId).delete()

    // Удаляем связи с тегами
    const postTagsSnapshot = await db
      .collection("post_tags")
      .where("post_id", "==", postId)
      .get()

    if (!postTagsSnapshot.empty) {
      const batch1 = db.batch()
      postTagsSnapshot.docs.forEach((doc) => {
        batch1.delete(doc.ref)
      })
      await batch1.commit()
    }

    // Удаляем лайки поста
    const likesSnapshot = await db
      .collection("likes")
      .where("post_id", "==", postId)
      .get()

    if (!likesSnapshot.empty) {
      const batch2 = db.batch()
      likesSnapshot.docs.forEach((doc) => {
        batch2.delete(doc.ref)
      })
      await batch2.commit()
    }

    // Удаляем просмотры поста
    const viewsSnapshot = await db
      .collection("views")
      .where("post_id", "==", postId)
      .get()

    if (!viewsSnapshot.empty) {
      const batch3 = db.batch()
      viewsSnapshot.docs.forEach((doc) => {
        batch3.delete(doc.ref)
      })
      await batch3.commit()
    }

    // Находим все комментарии к посту
    const commentsSnapshot = await db
      .collection("comments")
      .where("post_id", "==", postId)
      .get()

    if (!commentsSnapshot.empty) {
      // Получаем ID всех комментариев
      const commentIds = commentsSnapshot.docs.map((doc) => doc.id)

      // Удаляем комментарии
      const batch4 = db.batch()
      commentsSnapshot.docs.forEach((doc) => {
        batch4.delete(doc.ref)
      })
      await batch4.commit()

      // Удаляем лайки комментариев по частям (максимум 5 комментариев за раз)
      for (let i = 0; i < commentIds.length; i += 5) {
        const commentIdsChunk = commentIds.slice(i, i + 5)

        for (const commentId of commentIdsChunk) {
          const commentLikesSnapshot = await db
            .collection("comment_likes")
            .where("comment_id", "==", commentId)
            .get()

          if (!commentLikesSnapshot.empty) {
            const batch5 = db.batch()
            commentLikesSnapshot.docs.forEach((doc) => {
              batch5.delete(doc.ref)
            })
            await batch5.commit()
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error(`Ошибка при удалении поста ${postId}:`, error)
    return false
  }
}

// Запускаем функцию удаления
findAndDeleteDuplicatePosts()
  .then(() => {
    console.log("Скрипт завершен успешно")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Ошибка при выполнении скрипта:", error)
    process.exit(1)
  })
