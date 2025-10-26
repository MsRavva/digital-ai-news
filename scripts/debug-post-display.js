const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const postId = "ahcqo4NHXvD4RTQk6l0O"

async function debugPost() {
  try {
    // 1. Проверяем существование публикации
    const postDoc = await db.collection("posts").doc(postId).get()

    if (!postDoc.exists) {
      console.log("Публикация не существует")
      return
    }

    const postData = postDoc.data()
    console.log("Публикация существует:")
    console.log("- ID:", postId)
    console.log("- Заголовок:", postData.title)
    console.log("- Категория:", postData.category)
    console.log("- Дата создания:", postData.created_at.toDate())
    console.log("- Архивирована:", postData.archived ? "Да" : "Нет")

    // 2. Проверяем, есть ли у публикации все необходимые поля
    const requiredFields = [
      "title",
      "content",
      "category",
      "author_id",
      "created_at",
    ]
    const missingFields = requiredFields.filter((field) => !postData[field])

    if (missingFields.length > 0) {
      console.log("\nОтсутствуют обязательные поля:", missingFields.join(", "))
    } else {
      console.log("\nВсе обязательные поля присутствуют")
    }

    // 3. Проверяем автора публикации
    if (postData.author_id) {
      const authorDoc = await db
        .collection("profiles")
        .doc(postData.author_id)
        .get()

      if (authorDoc.exists) {
        const authorData = authorDoc.data()
        console.log("\nАвтор публикации:")
        console.log("- ID:", postData.author_id)
        console.log("- Имя:", authorData.username)
        console.log("- Роль:", authorData.role)
      } else {
        console.log(
          "\nАвтор публикации не найден (ID:",
          postData.author_id,
          ")",
        )
      }
    } else {
      console.log("\nID автора отсутствует")
    }

    // 4. Проверяем, как публикация выглядит в запросе getPosts
    console.log("\nПроверяем запрос getPosts:")

    // Запрос без фильтрации по архивации
    const allPostsQuery = await db.collection("posts").get()
    const allPosts = []

    allPostsQuery.forEach((doc) => {
      allPosts.push({
        id: doc.id,
        title: doc.data().title,
        category: doc.data().category,
        archived: doc.data().archived || false,
      })
    })

    const foundInAll = allPosts.find((post) => post.id === postId)
    console.log("- Найдена среди всех публикаций:", foundInAll ? "Да" : "Нет")

    // Запрос с фильтрацией по архивации
    const nonArchivedQuery = await db
      .collection("posts")
      .where("archived", "in", [false, null])
      .get()

    const nonArchivedPosts = []
    nonArchivedQuery.forEach((doc) => {
      nonArchivedPosts.push({
        id: doc.id,
        title: doc.data().title,
        category: doc.data().category,
        archived: doc.data().archived || false,
      })
    })

    const foundInNonArchived = nonArchivedPosts.find(
      (post) => post.id === postId,
    )
    console.log(
      "- Найдена среди неархивированных публикаций:",
      foundInNonArchived ? "Да" : "Нет",
    )

    // 5. Проверяем, как публикация выглядит в запросе с фильтрацией по категории
    const categoryQuery = await db
      .collection("posts")
      .where("category", "==", postData.category)
      .where("archived", "in", [false, null])
      .get()

    const categoryPosts = []
    categoryQuery.forEach((doc) => {
      categoryPosts.push({
        id: doc.id,
        title: doc.data().title,
      })
    })

    const foundInCategory = categoryPosts.find((post) => post.id === postId)
    console.log(
      "- Найдена среди публикаций категории",
      postData.category + ":",
      foundInCategory ? "Да" : "Нет",
    )

    // 6. Проверяем, есть ли у публикации теги
    const postTagsQuery = await db
      .collection("post_tags")
      .where("post_id", "==", postId)
      .get()

    if (postTagsQuery.empty) {
      console.log("\nУ публикации нет тегов")
    } else {
      const tagIds = []
      postTagsQuery.forEach((doc) => {
        tagIds.push(doc.data().tag_id)
      })

      console.log("\nТеги публикации (ID):", tagIds.join(", "))

      // Получаем имена тегов
      const tagNames = []
      for (const tagId of tagIds) {
        const tagDoc = await db.collection("tags").doc(tagId).get()
        if (tagDoc.exists) {
          tagNames.push(tagDoc.data().name)
        }
      }

      console.log("Теги публикации (имена):", tagNames.join(", "))
    }

    // 7. Проверяем, есть ли у публикации какие-то необычные поля или значения
    console.log("\nВсе поля публикации:")
    Object.entries(postData).forEach(([key, value]) => {
      const valueStr =
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : value
      console.log(`- ${key}: ${valueStr}`)
    })

    // 8. Проверяем, есть ли у публикации статистика
    const likesQuery = await db
      .collection("likes")
      .where("post_id", "==", postId)
      .get()

    const commentsQuery = await db
      .collection("comments")
      .where("post_id", "==", postId)
      .get()

    const viewsQuery = await db
      .collection("views")
      .where("post_id", "==", postId)
      .get()

    console.log("\nСтатистика публикации:")
    console.log("- Лайки:", likesQuery.size)
    console.log("- Комментарии:", commentsQuery.size)
    console.log("- Просмотры:", viewsQuery.size)
  } catch (error) {
    console.error("Ошибка при отладке публикации:", error)
  }
}

debugPost()
  .then(() => {
    console.log("\nОтладка завершена")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Ошибка:", err)
    process.exit(1)
  })
