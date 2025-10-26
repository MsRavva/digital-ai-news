import { Comment, type Post, type PostStats, Tag } from "@/types/database"
import { getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Инициализация Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig)
}

// Получение экземпляров Firebase сервисов
export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()

// Вспомогательная функция для конвертации Timestamp в ISO строку
export function convertTimestampToISO(timestamp: Timestamp | any): string {
  if (!timestamp) {
    return new Date().toISOString()
  }

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }

  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString()
  }

  return new Date(timestamp).toISOString()
}

// Получение всех постов
export async function getPosts(
  category?: string,
  includeArchived = false,
): Promise<Post[]> {
  try {
    // Создаем базовый запрос
    let postsQuery = collection(db, "posts")
    const queryConditions = []

    // Добавляем фильтр по категории, если указана
    if (category && category !== "all") {
      queryConditions.push(where("category", "==", category))
    }

    // Добавляем фильтр по архивации
    if (!includeArchived) {
      queryConditions.push(where("archived", "in", [false, null]))
    }

    // Добавляем сортировку по закреплению и дате создания
    queryConditions.push(orderBy("pinned", "desc")) // Сначала закрепленные
    queryConditions.push(orderBy("created_at", "desc")) // Затем по дате (от новых к старым)

    // Применяем фильтры
    postsQuery = query(postsQuery, ...queryConditions)

    // Получаем посты
    const postsSnapshot = await getDocs(postsQuery)

    // Получаем ID всех постов
    const postIds = postsSnapshot.docs.map((doc) => doc.id)
    const authorIds = [
      ...new Set(
        postsSnapshot.docs
          .map((doc) => doc.data().author_id)
          .filter((id) => id !== undefined && id !== null),
      ),
    ]

    // Получаем всех авторов одним запросом
    const authorsMap = new Map()
    for (const authorId of authorIds) {
      if (authorId) {
        // Проверяем, что authorId не undefined и не null
        try {
          const authorDoc = await getDoc(doc(db, "profiles", authorId))
          if (authorDoc.exists()) {
            authorsMap.set(authorId, authorDoc.data())
          }
        } catch (error) {
          console.error(
            `Ошибка при получении профиля автора ${authorId}:`,
            error,
          )
        }
      }
    }

    // Получаем все связи постов с тегами по частям (максимум 30 значений в IN)
    let allPostTagsDocs = []

    // Разбиваем массив postIds на части по 30 элементов
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30)

      if (postIdsBatch.length > 0) {
        const postTagsQuery = query(
          collection(db, "post_tags"),
          where("post_id", "in", postIdsBatch),
        )
        const batchSnapshot = await getDocs(postTagsQuery)
        allPostTagsDocs = [...allPostTagsDocs, ...batchSnapshot.docs]
      }
    }

    // Создаем объект с нужной структурой
    const postTagsSnapshot = { docs: allPostTagsDocs }

    // Группируем связи по ID поста
    const postTagsMap = new Map()
    postTagsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (!postTagsMap.has(data.post_id)) {
        postTagsMap.set(data.post_id, [])
      }
      postTagsMap.get(data.post_id).push(data.tag_id)
    })

    // Получаем все теги одним запросом
    const allTagIds = [
      ...new Set(postTagsSnapshot.docs.map((doc) => doc.data().tag_id)),
    ]
    const tagsMap = new Map()

    if (allTagIds.length > 0) {
      for (const tagId of allTagIds) {
        const tagDoc = await getDoc(doc(db, "tags", tagId))
        if (tagDoc.exists()) {
          tagsMap.set(tagId, tagDoc.data().name)
        }
      }
    }

    // Получаем статистику для всех постов по частям
    // Лайки
    const likesCountMap = new Map()
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30)

      if (postIdsBatch.length > 0) {
        const likesQuery = query(
          collection(db, "likes"),
          where("post_id", "in", postIdsBatch),
        )
        const likesSnapshot = await getDocs(likesQuery)

        likesSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          likesCountMap.set(
            data.post_id,
            (likesCountMap.get(data.post_id) || 0) + 1,
          )
        })
      }
    }

    // Комментарии
    const commentsCountMap = new Map()
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30)

      if (postIdsBatch.length > 0) {
        const commentsQuery = query(
          collection(db, "comments"),
          where("post_id", "in", postIdsBatch),
        )
        const commentsSnapshot = await getDocs(commentsQuery)

        commentsSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          commentsCountMap.set(
            data.post_id,
            (commentsCountMap.get(data.post_id) || 0) + 1,
          )
        })
      }
    }

    // Просмотры
    const viewsCountMap = new Map()
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30)

      if (postIdsBatch.length > 0) {
        const viewsQuery = query(
          collection(db, "views"),
          where("post_id", "in", postIdsBatch),
        )
        const viewsSnapshot = await getDocs(viewsQuery)

        viewsSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          viewsCountMap.set(
            data.post_id,
            (viewsCountMap.get(data.post_id) || 0) + 1,
          )
        })
      }
    }

    // Формируем итоговый массив постов
    const posts: Post[] = postsSnapshot.docs.map((postDoc) => {
      const postData = postDoc.data()
      const postId = postDoc.id

      // Получаем автора
      const authorData = authorsMap.get(postData.author_id)

      // Получаем теги
      const tagIds = postTagsMap.get(postId) || []
      const tags = tagIds.map((tagId) => tagsMap.get(tagId)).filter(Boolean)

      // Получаем статистику
      const likesCount = likesCountMap.get(postId) || 0
      const commentsCount = commentsCountMap.get(postId) || 0
      const viewsCount = viewsCountMap.get(postId) || 0

      return {
        id: postId,
        title: postData.title,
        content: postData.content,
        author: {
          username: authorData?.username || "Unknown",
          role: authorData?.role || "student",
        },
        author_id: postData.author_id,
        created_at: convertTimestampToISO(postData.created_at),
        category: postData.category,
        tags,
        likesCount,
        commentsCount,
        viewsCount,
        archived: postData.archived || false,
        pinned: postData.pinned || false,
      }
    })

    return posts
  } catch (error) {
    console.error("Error fetching posts:", error)
    return []
  }
}

// Получение поста по ID
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    // Получаем документ поста
    const postDoc = await getDoc(doc(db, "posts", postId))

    if (!postDoc.exists()) {
      return null
    }

    const postData = postDoc.data()
    const authorId = postData.author_id

    // Получаем автора
    let authorData = null
    if (authorId) {
      const authorDoc = await getDoc(doc(db, "profiles", authorId))
      if (authorDoc.exists()) {
        authorData = authorDoc.data()
      }
    }

    // Получаем теги
    const postTagsQuery = query(
      collection(db, "post_tags"),
      where("post_id", "==", postId),
    )
    const postTagsSnapshot = await getDocs(postTagsQuery)
    const tagIds = postTagsSnapshot.docs.map((doc) => doc.data().tag_id)

    const tags: string[] = []
    for (const tagId of tagIds) {
      const tagDoc = await getDoc(doc(db, "tags", tagId))
      if (tagDoc.exists()) {
        tags.push(tagDoc.data().name)
      }
    }

    // Получаем статистику
    const stats = await getPostStats(postId)

    return {
      id: postId,
      title: postData.title,
      content: postData.content,
      author: {
        username: authorData?.username || "Unknown",
        role: authorData?.role || "student",
      },
      author_id: authorId,
      created_at: convertTimestampToISO(postData.created_at),
      category: postData.category,
      tags,
      likesCount: stats.likesCount,
      commentsCount: stats.commentsCount,
      viewsCount: stats.viewsCount,
      archived: postData.archived || false,
      pinned: postData.pinned || false,
    }
  } catch (error) {
    console.error("Error fetching post:", error)
    return null
  }
}

// Создание нового поста
export async function createPost(data: {
  title: string
  content: string
  category: string
  author_id: string
  tags: string[]
  source_url?: string // Добавляем опциональное поле для URL источника
}): Promise<string | null> {
  try {
    // Используем транзакцию для создания поста и связанных тегов
    const batch = writeBatch(db)

    // Получаем текущую дату в формате Timestamp
    const now = Timestamp.now()

    // Создаем пост с явным указанием всех необходимых полей
    const postRef = doc(collection(db, "posts"))
    batch.set(postRef, {
      title: data.title || "",
      content: data.content || "",
      category: data.category || "news",
      author_id: data.author_id,
      // Используем явный Timestamp вместо serverTimestamp() для гарантии корректной даты
      created_at: now,
      updated_at: now,
      // Явно устанавливаем archived и pinned в false
      archived: false,
      pinned: false,
      // Инициализируем счетчики
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      // Добавляем URL источника, если он есть
      source_url: data.source_url || null,
    })

    // Создаем теги и связи с постом
    for (const tagName of data.tags) {
      // Проверяем, существует ли тег
      const tagsQuery = query(
        collection(db, "tags"),
        where("name", "==", tagName),
      )
      const tagsSnapshot = await getDocs(tagsQuery)

      let tagId: string

      if (tagsSnapshot.empty) {
        // Создаем новый тег
        const tagRef = doc(collection(db, "tags"))
        batch.set(tagRef, { name: tagName })
        tagId = tagRef.id
      } else {
        tagId = tagsSnapshot.docs[0].id
      }

      // Создаем связь поста с тегом
      const postTagRef = doc(collection(db, "post_tags"))
      batch.set(postTagRef, {
        post_id: postRef.id,
        tag_id: tagId,
      })
    }

    // Выполняем транзакцию
    await batch.commit()

    return postRef.id
  } catch (error) {
    console.error("Error creating post:", error)
    return null
  }
}

// Получение статистики поста (устаревшая версия, используется только для обратной совместимости)
export async function getPostStats(postId: string): Promise<PostStats> {
  try {
    // Получаем количество лайков
    const likesQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId),
    )
    const likesSnapshot = await getDocs(likesQuery)
    const likesCount = likesSnapshot.size

    // Получаем количество комментариев
    const commentsQuery = query(
      collection(db, "comments"),
      where("post_id", "==", postId),
    )
    const commentsSnapshot = await getDocs(commentsQuery)
    const commentsCount = commentsSnapshot.size

    // Получаем количество просмотров
    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId),
    )
    const viewsSnapshot = await getDocs(viewsQuery)
    const viewsCount = viewsSnapshot.size

    return {
      likesCount,
      commentsCount,
      viewsCount,
    }
  } catch (error) {
    console.error("Error fetching post stats:", error)
    return {
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
    }
  }
}

// Запись просмотра поста
export async function recordView(
  postId: string,
  userId: string,
): Promise<void> {
  try {
    // Проверяем, просматривал ли пользователь этот пост ранее
    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId),
      where("user_id", "==", userId),
    )
    const viewsSnapshot = await getDocs(viewsQuery)

    if (viewsSnapshot.empty) {
      // Записываем просмотр
      await addDoc(collection(db, "views"), {
        post_id: postId,
        user_id: userId,
        created_at: serverTimestamp(),
      })

      // Обновляем счетчик просмотров в посте
      const postRef = doc(db, "posts", postId)
      const postDoc = await getDoc(postRef)

      if (postDoc.exists()) {
        // Проверяем, существует ли поле viewsCount
        const postData = postDoc.data()
        const currentViews = postData.viewsCount || 0

        await updateDoc(postRef, {
          viewsCount: currentViews + 1,
        })
      }
    }
  } catch (error) {
    console.error("Error recording view:", error)
  }
}

// Обновление поста
export async function updatePost(data: {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}): Promise<boolean> {
  try {
    // Используем транзакцию для обновления поста и связанных тегов
    const batch = writeBatch(db)

    // Обновляем пост
    const postRef = doc(db, "posts", data.id)
    batch.update(postRef, {
      title: data.title,
      content: data.content,
      category: data.category,
      updated_at: serverTimestamp(),
    })

    // Удаляем старые связи с тегами
    const postTagsQuery = query(
      collection(db, "post_tags"),
      where("post_id", "==", data.id),
    )
    const postTagsSnapshot = await getDocs(postTagsQuery)
    postTagsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Добавляем новые теги
    for (const tagName of data.tags) {
      // Проверяем, существует ли тег
      const tagsQuery = query(
        collection(db, "tags"),
        where("name", "==", tagName),
      )
      const tagsSnapshot = await getDocs(tagsQuery)

      let tagId: string

      if (tagsSnapshot.empty) {
        // Создаем новый тег
        const tagRef = doc(collection(db, "tags"))
        batch.set(tagRef, { name: tagName })
        tagId = tagRef.id
      } else {
        tagId = tagsSnapshot.docs[0].id
      }

      // Создаем связь поста с тегом
      const postTagRef = doc(collection(db, "post_tags"))
      batch.set(postTagRef, {
        post_id: data.id,
        tag_id: tagId,
      })
    }

    // Выполняем транзакцию
    await batch.commit()

    return true
  } catch (error) {
    console.error("Error updating post:", error)
    return false
  }
}

// Удаление поста
export async function deletePost(postId: string): Promise<boolean> {
  try {
    // Проверяем, существует ли пост
    const postRef = doc(db, "posts", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      console.error("Post not found:", postId)
      return false
    }

    // Получаем текущего пользователя
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      console.error("User not authenticated")
      return false
    }

    // Получаем профиль пользователя для проверки роли
    const userProfileRef = doc(db, "profiles", currentUser.uid)
    const userProfileDoc = await getDoc(userProfileRef)

    if (!userProfileDoc.exists()) {
      console.error("User profile not found")
      return false
    }

    const userProfile = userProfileDoc.data()
    const postData = postDoc.data()

    // Проверяем права доступа
    const isAuthor = postData.author_id === currentUser.uid
    const isTeacherOrAdmin =
      userProfile.role === "teacher" || userProfile.role === "admin"

    if (!isAuthor && !isTeacherOrAdmin) {
      console.error("User does not have permission to delete this post")
      return false
    }

    // Используем транзакцию для удаления поста и связанных данных
    const batch = writeBatch(db)

    // Удаляем пост
    batch.delete(postRef)

    // Удаляем связи с тегами
    const postTagsQuery = query(
      collection(db, "post_tags"),
      where("post_id", "==", postId),
    )
    const postTagsSnapshot = await getDocs(postTagsQuery)
    postTagsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Удаляем лайки поста
    const likesQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId),
    )
    const likesSnapshot = await getDocs(likesQuery)
    likesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Удаляем просмотры поста
    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId),
    )
    const viewsSnapshot = await getDocs(viewsQuery)
    viewsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Находим все комментарии к посту
    const commentsQuery = query(
      collection(db, "comments"),
      where("post_id", "==", postId),
    )
    const commentsSnapshot = await getDocs(commentsQuery)

    // Получаем ID всех комментариев
    const commentIds = commentsSnapshot.docs.map((doc) => doc.id)

    // Удаляем комментарии
    commentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Удаляем лайки комментариев
    if (commentIds.length > 0) {
      for (const commentId of commentIds) {
        const commentLikesQuery = query(
          collection(db, "comment_likes"),
          where("comment_id", "==", commentId),
        )
        const commentLikesSnapshot = await getDocs(commentLikesQuery)
        commentLikesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })
      }
    }

    // Выполняем транзакцию
    await batch.commit()

    return true
  } catch (error) {
    console.error("Error deleting post:", error)
    return false
  }
}
