import { db } from "./firebase"
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore"
import type { Post } from "@/types/database"

// Вспомогательная функция для преобразования Timestamp в ISO строку
function convertTimestampToISO(timestamp: Timestamp | any): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString()
  }
  return new Date(timestamp).toISOString()
}

// Получение поста по ID
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return null
    }
    const postRef = doc(db, "posts", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      return null
    }

    const postData = postDoc.data()
    const postIdValue = postDoc.id

    // Получаем автора
    let authorData = null
    if (postData.author_id) {
      const authorDoc = await getDoc(doc(db, "profiles", postData.author_id))
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

    // Получаем статистику (лайки, комментарии, просмотры)

    const likesQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId),
    )
    const likesSnapshot = await getDocs(likesQuery)
    const likesCount = likesSnapshot.size

    const commentsQuery = query(
      collection(db, "comments"),
      where("post_id", "==", postId),
    )
    const commentsSnapshot = await getDocs(commentsQuery)
    const commentsCount = commentsSnapshot.size

    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId),
    )
    const viewsSnapshot = await getDocs(viewsQuery)
    const viewsCount = viewsSnapshot.size

    return {
      id: postIdValue,
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
  } catch (error) {
    console.error("Error fetching post:", error)
    return null
  }
}

// Создание поста
export async function createPost(data: {
  title: string
  content: string
  category: string
  author_id: string
  tags: string[]
  source_url?: string
}): Promise<string | null> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return null
    }
    const batch = writeBatch(db)
    const now = Timestamp.now()

    // Создаем пост
    const postRef = doc(collection(db, "posts"))
    batch.set(postRef, {
      title: data.title,
      content: data.content,
      category: data.category,
      author_id: data.author_id,
      source_url: data.source_url || null,
      created_at: now,
      updated_at: now,
      archived: false,
      pinned: false,
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

// Обновление поста
export async function updatePost(data: {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
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
    postTagsSnapshot.docs.forEach((docRef) => {
      batch.delete(docRef.ref)
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

// Запись просмотра
export async function recordView(
  postId: string,
  userId: string,
): Promise<void> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return
    }
    // Проверяем, не просматривал ли пользователь этот пост ранее
    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId),
      where("user_id", "==", userId),
    )
    const viewsSnapshot = await getDocs(viewsQuery)

    // Если просмотр уже был, не добавляем новый
    if (!viewsSnapshot.empty) {
      return
    }

    // Добавляем новый просмотр
    await addDoc(collection(db, "views"), {
      post_id: postId,
      user_id: userId,
      viewed_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error recording view:", error)
  }
}

