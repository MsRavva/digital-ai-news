// Скрипт для проверки функции getPaginatedPosts
const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccountKey.json")

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

// Функция для получения публикаций с пагинацией
async function getPaginatedPosts(options = {}) {
  try {
    const {
      limit = 10,
      startAfter,
      category,
      authorId,
      tag,
      includeArchived = false,
    } = options

    console.log("Параметры запроса:")
    console.log("- limit:", limit)
    console.log("- startAfter:", startAfter || "не указан")
    console.log("- category:", category || "не указана")
    console.log("- authorId:", authorId || "не указан")
    console.log("- tag:", tag || "не указан")
    console.log("- includeArchived:", includeArchived)

    // Шаг 1: Создаем базовый запрос
    let postsQuery = db.collection("posts")
    const queryConditions = []

    // Добавляем фильтр по категории, если указана
    if (category && category !== "all") {
      queryConditions.push(["category", "==", category])
    }

    // Добавляем фильтр по автору, если указан
    if (authorId) {
      queryConditions.push(["author_id", "==", authorId])
    }

    // Добавляем фильтр по архивации
    if (!includeArchived) {
      queryConditions.push(["archived", "in", [false, null]])
    }

    // Применяем фильтры
    for (const [field, operator, value] of queryConditions) {
      postsQuery = postsQuery.where(field, operator, value)
    }

    // Добавляем сортировку по дате создания (от новых к старым)
    postsQuery = postsQuery.orderBy("created_at", "desc")

    // Если указан startAfter, добавляем курсор для пагинации
    if (startAfter) {
      const startAfterDoc = await db.collection("posts").doc(startAfter).get()
      if (startAfterDoc.exists) {
        postsQuery = postsQuery.startAfter(startAfterDoc)
      }
    }

    // Добавляем ограничение по количеству результатов
    postsQuery = postsQuery.limit(limit)

    // Шаг 2: Получаем посты
    const postsSnapshot = await postsQuery.get()

    console.log(`Найдено публикаций: ${postsSnapshot.size}`)

    if (postsSnapshot.empty) {
      return { posts: [], lastVisible: null }
    }

    // Выводим ID всех найденных публикаций
    console.log("ID найденных публикаций:")
    postsSnapshot.docs.forEach((doc) => {
      console.log(`- ${doc.id} (${doc.data().title})`)
    })

    // Шаг 3: Возвращаем результат
    const lastVisible =
      postsSnapshot.docs.length > 0
        ? postsSnapshot.docs[postsSnapshot.docs.length - 1].id
        : null

    return {
      posts: postsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      lastVisible,
    }
  } catch (error) {
    console.error("Ошибка при получении публикаций:", error)
    return { posts: [], lastVisible: null }
  }
}

// Проверяем конкретную публикацию
async function checkPosts() {
  try {
    const postId = "ahcqo4NHXvD4RTQk6l0O"

    console.log(`=== Проверка публикации ${postId} ===`)
    const postDoc = await db.collection("posts").doc(postId).get()

    if (postDoc.exists) {
      const postData = postDoc.data()
      console.log(`Публикация ${postId} найдена:`)
      console.log(`- Заголовок: ${postData.title}`)
      console.log(`- Категория: ${postData.category}`)
      console.log(`- Архивирована: ${postData.archived ? "Да" : "Нет"}`)

      // Проверяем, почему публикация может не попадать в выборку
      if (postData.category === "news") {
        console.log(
          'Категория "news" - должна отображаться при фильтре по этой категории',
        )
      } else {
        console.log(
          `Категория "${postData.category}" - не будет отображаться при фильтре по категории "news"`,
        )
      }

      if (postData.archived) {
        console.log(
          "Публикация архивирована - не будет отображаться при includeArchived=false",
        )
      } else {
        console.log(
          "Публикация не архивирована - должна отображаться при includeArchived=false",
        )
      }

      // Проверяем теги
      const postTagsSnapshot = await db
        .collection("post_tags")
        .where("post_id", "==", postId)
        .get()
      const tagIds = postTagsSnapshot.docs.map((doc) => doc.data().tag_id)

      console.log(`\nТеги публикации (${tagIds.length}):`)
      for (const tagId of tagIds) {
        const tagDoc = await db.collection("tags").doc(tagId).get()
        if (tagDoc.exists) {
          console.log(`- ${tagDoc.data().name} (ID: ${tagId})`)
        }
      }

      // Проверяем запрос с фильтром по категории
      console.log('\n=== Проверка запроса с фильтром по категории "news" ===')
      await getPaginatedPosts({ category: "news" })
    } else {
      console.log(`Публикация ${postId} не найдена`)
    }
  } catch (error) {
    console.error("Ошибка при проверке публикаций:", error)
  }
}

// Запускаем проверку
checkPosts().then(() => process.exit())
