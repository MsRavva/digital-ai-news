import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Post } from "@/types/database"

export function convertTimestampToISO(timestamp: Timestamp | any): string {
  if (!timestamp) {
    return new Date().toISOString()
  }

  if (timestamp.toDate && typeof timestamp.toDate === "function") {
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
  archivedOnly = false,
): Promise<Post[]> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return []
    }
    // Создаем базовый запрос
    const postsQuery = collection(db, "posts")
    const queryConditions = []

    // Добавляем фильтр по категории, если указана
    if (category && category !== "all") {
      queryConditions.push(where("category", "==", category))
    }

    // Добавляем фильтр по архивации
    if (archivedOnly) {
      queryConditions.push(where("archived", "==", true))
    } else if (!includeArchived) {
      queryConditions.push(where("archived", "in", [false, null]))
    }

    // Добавляем сортировку по закреплению и дате создания
    queryConditions.push(orderBy("pinned", "desc")) // Сначала закрепленные
    queryConditions.push(orderBy("created_at", "desc")) // Затем по дате (от новых к старым)

    // Применяем фильтры
    const finalQuery = query(postsQuery, ...queryConditions)

    // Получаем посты
    const postsSnapshot = await getDocs(finalQuery)

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
        try {
          const authorDoc = await getDoc(doc(db, "profiles", authorId))
          if (authorDoc.exists()) {
            authorsMap.set(authorId, authorDoc.data())
          }
        } catch (error) {
          console.error(`Error fetching author ${authorId}:`, error)
        }
      }
    }

    // Получаем теги для всех постов
    const postTagsMap = new Map()
    const tagsMap = new Map()

    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30)

      if (postIdsBatch.length > 0) {
        const postTagsQuery = query(
          collection(db, "post_tags"),
          where("post_id", "in", postIdsBatch),
        )
        const postTagsSnapshot = await getDocs(postTagsQuery)

        postTagsSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          const postId = data.post_id
          const tagId = data.tag_id

          if (!postTagsMap.has(postId)) {
            postTagsMap.set(postId, [])
          }
          postTagsMap.get(postId).push(tagId)
        })
      }
    }

    // Получаем все теги
    const tagIds = [
      ...new Set(
        Array.from(postTagsMap.values()).flat().filter((id) => id),
      ),
    ]

    for (let i = 0; i < tagIds.length; i += 30) {
      const tagIdsBatch = tagIds.slice(i, i + 30)

      if (tagIdsBatch.length > 0) {
        for (const tagId of tagIdsBatch) {
          try {
            const tagDoc = await getDoc(doc(db, "tags", tagId))
            if (tagDoc.exists()) {
              tagsMap.set(tagId, tagDoc.data().name)
            }
          } catch (error) {
            console.error(`Error fetching tag ${tagId}:`, error)
          }
        }
      }
    }

    // Получаем статистику (лайки, комментарии, просмотры)
    const likesCountMap = new Map()
    const commentsCountMap = new Map()
    const viewsCountMap = new Map()

    // Лайки
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
      const tags = tagIds.map((tagId: string) => tagsMap.get(tagId)).filter(Boolean) as string[]

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

